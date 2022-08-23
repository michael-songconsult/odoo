# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import api, fields, models


class SaleOrder(models.Model):
    _inherit = 'sale.order'

    amount_delivery = fields.Monetary(
        compute='_compute_amount_delivery',
        string='Delivery Amount',
        help="The amount without tax.", store=True, tracking=True)
    access_point_address = fields.Json('Delivery Point Address')

    @api.depends('order_line.price_unit', 'order_line.tax_id', 'order_line.discount', 'order_line.product_uom_qty')
    def _compute_amount_delivery(self):
        for order in self:
            if self.env.company.show_line_subtotals_tax_selection == 'tax_excluded':
                order.amount_delivery = sum(order.order_line.filtered('is_delivery').mapped('price_subtotal'))
            else:
                order.amount_delivery = sum(order.order_line.filtered('is_delivery').mapped('price_total'))

    def _action_confirm(self):
        for order in self:
            order_location = order.access_point_address

            if not order_location:
                continue

            # retreive all the data :
            # name, street, city, state, zip, country
            name = order.partner_shipping_id.name
            street = order_location['pick_up_point_address']
            city = order_location['pick_up_point_town']
            zip_code = order_location['pick_up_point_postal_code']
            country = order.env['res.country'].search([('code', '=', order_location['pick_up_point_country'])]).id
            state = order.env['res.country.state'].search(['&', ('code', '=', order_location['pick_up_point_state']), ('country_id.id', '=', country)]).id if (order_location['pick_up_point_state'] and country) else None
            parent_id = order.partner_shipping_id.id
            email = order.partner_shipping_id.email
            phone = order.partner_shipping_id.phone

            # we can check if the current partner has a partner of type "delivery" that has the same address
            existing_partner = order.env['res.partner'].search(['&', '&', '&', '&',
                                                                ('street', '=', street),
                                                                ('city', '=', city),
                                                                ('state_id', '=', state),
                                                                ('country_id', '=', country),
                                                                ('type', '=', 'delivery')], limit=1)

            if existing_partner:
                order.partner_shipping_id = existing_partner
            else:
                # if not, we create that res.partner
                order.partner_shipping_id = order.env['res.partner'].create({
                    'parent_id': parent_id,
                    'type': 'delivery',
                    'name': name,
                    'street': street,
                    'city': city,
                    'state_id': state,
                    'zip': zip_code,
                    'country_id': country,
                    'email': email,
                    'phone': phone
                })
        return super()._action_confirm()

    def _check_carrier_quotation(self, force_carrier_id=None, keep_carrier=False):
        self.ensure_one()
        DeliveryCarrier = self.env['delivery.carrier']

        if self.only_services:
            self._remove_delivery_line()
            return True
        else:
            self = self.with_company(self.company_id)
            # attempt to use partner's preferred carrier
            if not force_carrier_id and self.partner_shipping_id.property_delivery_carrier_id and not keep_carrier:
                force_carrier_id = self.partner_shipping_id.property_delivery_carrier_id.id

            carrier = force_carrier_id and DeliveryCarrier.browse(force_carrier_id) or self.carrier_id
            available_carriers = self._get_delivery_methods()
            if carrier:
                if carrier not in available_carriers:
                    carrier = DeliveryCarrier
                else:
                    # set the forced carrier at the beginning of the list to be verfied first below
                    available_carriers -= carrier
                    available_carriers = carrier + available_carriers
            if force_carrier_id or not carrier or carrier not in available_carriers:
                for delivery in available_carriers:
                    verified_carrier = delivery._match_address(self.partner_shipping_id)
                    if verified_carrier:
                        carrier = delivery
                        break
                self.write({'carrier_id': carrier.id})
            self._remove_delivery_line()
            if carrier:
                res = carrier.rate_shipment(self)
                if res.get('success'):
                    self.set_delivery_line(carrier, res['price'])
                    self.delivery_rating_success = True
                    self.delivery_message = res['warning_message']
                else:
                    self.set_delivery_line(carrier, 0.0)
                    self.delivery_rating_success = False
                    self.delivery_message = res['error_message']

        return bool(carrier)

    def _get_delivery_methods(self):
        address = self.partner_shipping_id
        # searching on website_published will also search for available website (_search method on computed field)
        return self.env['delivery.carrier'].sudo().search([('website_published', '=', True)]).available_carriers(address)

    def _cart_update(self, *args, **kwargs):
        """ Override to update carrier quotation if quantity changed """
        self._remove_delivery_line()
        return super()._cart_update(*args, **kwargs)
