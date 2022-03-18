/** @odoo-module **/

import {
    afterNextRender,
    start,
    startServer,
} from '@mail/../tests/helpers/test_utils';

QUnit.module('mail', {}, function () {
QUnit.module('components', {}, function () {
QUnit.module('channel_invitation_form_tests.js');

QUnit.test('should display the channel invitation form after clicking on the invite button of a chat', async function (assert) {
    assert.expect(1);

    const pyEnv = await startServer();
    const resPartnerId1 = pyEnv['res.partner'].create({
        email: "testpartner@odoo.com",
        name: "TestPartner",
    });
    pyEnv['res.users'].create({ partner_id: resPartnerId1 });
    const mailChannelId1 = pyEnv['mail.channel'].create({
        channel_type: 'chat',
        members: [pyEnv.currentPartnerId, resPartnerId1],
        public: 'private',
    });
    await start({
        autoOpenDiscuss: true,
        discuss: {
            context: {
                active_id: mailChannelId1,
            },
        },
        hasDiscuss: true,
    });
    await afterNextRender(() => document.querySelector(`.o_ThreadViewTopbar_inviteButton`).click());
    assert.containsOnce(
        document.body,
        '.o_ChannelInvitationForm',
        "should display the channel invitation form after clicking on the invite button of a chat"
    );
});

QUnit.test('should be able to search for a new user to invite from an existing chat', async function (assert) {
    assert.expect(1);

    const pyEnv = await startServer();
    const resPartnerId1 = pyEnv['res.partner'].create({
        email: "testpartner@odoo.com",
        name: "TestPartner",
    });
    const resPartnerId2 = pyEnv['res.partner'].create({
        email: "testpartner2@odoo.com",
        name: "TestPartner2",
    });
    pyEnv['res.users'].create({ partner_id: resPartnerId1 });
    pyEnv['res.users'].create({ partner_id: resPartnerId2 });
    const mailChannelId1 = pyEnv['mail.channel'].create({
        channel_type: 'chat',
        members: [pyEnv.currentPartnerId, resPartnerId1],
        public: 'private',
    });
    await start({
        autoOpenDiscuss: true,
        discuss: {
            context: {
                active_id: mailChannelId1,
            },
        },
        hasDiscuss: true,
    });
    await afterNextRender(() => document.querySelector(`.o_ThreadViewTopbar_inviteButton`).click());
    await afterNextRender(() => document.execCommand('insertText', false, "TestPartner2"));
    assert.strictEqual(
       document.querySelector(`.o_ChannelInvitationForm_selectablePartnerName`).textContent,
       "TestPartner2",
       "should display 'TestPartner2' as it matches search term",
    );
});

QUnit.test('should be able to create a new group chat from an existing chat', async function (assert) {
    assert.expect(1);

    const pyEnv = await startServer();
    const resPartnerId1 = pyEnv['res.partner'].create({
        email: "testpartner@odoo.com",
        name: "TestPartner",
    });
    const resPartnerId2 = pyEnv['res.partner'].create({
        email: "testpartner2@odoo.com",
        name: "TestPartner2",
    });
    pyEnv['res.users'].create({ partner_id: resPartnerId1 });
    pyEnv['res.users'].create({ partner_id: resPartnerId2 });
    const mailChannelId1 = pyEnv['mail.channel'].create({
        channel_type: 'chat',
        members: [pyEnv.currentPartnerId, resPartnerId1],
        public: 'private',
    });
    await start({
        autoOpenDiscuss: true,
        discuss: {
            context: {
                active_id: mailChannelId1,
            },
        },
        hasDiscuss: true,
    });

    await afterNextRender(() => document.querySelector(`.o_ThreadViewTopbar_inviteButton`).click());
    await afterNextRender(() => document.execCommand('insertText', false, "TestPartner2"));
    document.querySelector(`.o_ChannelInvitationForm_selectablePartnerCheckbox`).click();
    await afterNextRender(() => document.querySelector(`.o_ChannelInvitationForm_inviteButton`).click());
    await afterNextRender(() => document.querySelector(`.o_ChannelInvitationForm_inviteButton`).click());
    assert.strictEqual(
       document.querySelector(`.o_ThreadViewTopbar_threadName`).textContent,
       'Mitchell Admin, TestPartner, TestPartner2',
       "should have created a new group chat with the existing chat members and the selected user",
    );
});

});
});
