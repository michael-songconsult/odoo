/** @odoo-module **/

import { start, startServer } from '@mail/../tests/helpers/test_utils';

QUnit.module('mail', {}, function () {
QUnit.module('components', {}, function () {
QUnit.module('composer_suggestion_partner_tests.js');

QUnit.test('partner mention suggestion displayed', async function (assert) {
    assert.expect(1);

    const pyEnv = await startServer();
    const mailChannelId1 = pyEnv['mail.channel'].create();
    const { createComposerSuggestionComponent, messaging } = await start();
    const thread = messaging.models['Thread'].findFromIdentifyingData({
        id: mailChannelId1,
        model: 'mail.channel',
    });
    const partner = messaging.models['Partner'].create({
        id: 7,
        im_status: 'online',
        name: "Demo User",
    });
    await createComposerSuggestionComponent(thread.composer, {
        isActive: true,
        modelName: 'Partner',
        recordLocalId: partner.localId,
    });

    assert.containsOnce(
        document.body,
        `.o_ComposerSuggestion`,
        "Partner mention suggestion should be present"
    );
});

QUnit.test('partner mention suggestion correct data', async function (assert) {
    assert.expect(6);

    const pyEnv = await startServer();
    const mailChannelId1 = pyEnv['mail.channel'].create();
    const { createComposerSuggestionComponent, messaging } = await start();
    const thread = messaging.models['Thread'].findFromIdentifyingData({
        id: mailChannelId1,
        model: 'mail.channel',
    });
    const partner = messaging.models['Partner'].create({
        email: "demo_user@odoo.com",
        id: 7,
        im_status: 'online',
        name: "Demo User",
    });
    await createComposerSuggestionComponent(thread.composer, {
        isActive: true,
        modelName: 'Partner',
        recordLocalId: partner.localId,
    });

    assert.containsOnce(
        document.body,
        '.o_ComposerSuggestion',
        "Partner mention suggestion should be present"
    );
    assert.strictEqual(
        document.querySelectorAll(`.o_PartnerImStatusIcon`).length,
        1,
        "Partner's im_status should be displayed"
    );
    assert.containsOnce(
        document.body,
        '.o_ComposerSuggestion_part1',
        "Partner's name should be present"
    );
    assert.strictEqual(
        document.querySelector(`.o_ComposerSuggestion_part1`).textContent,
        "Demo User",
        "Partner's name should be displayed"
    );
    assert.containsOnce(
        document.body,
        '.o_ComposerSuggestion_part2',
        "Partner's email should be present"
    );
    assert.strictEqual(
        document.querySelector(`.o_ComposerSuggestion_part2`).textContent,
        "(demo_user@odoo.com)",
        "Partner's email should be displayed"
    );
});

QUnit.test('partner mention suggestion active', async function (assert) {
    assert.expect(2);

    const pyEnv = await startServer();
    const mailChannelId1 = pyEnv['mail.channel'].create();
    const { createComposerSuggestionComponent, messaging } = await start();
    const thread = messaging.models['Thread'].findFromIdentifyingData({
        id: mailChannelId1,
        model: 'mail.channel',
    });
    const partner = messaging.models['Partner'].create({
        id: 7,
        im_status: 'online',
        name: "Demo User",
    });
    await createComposerSuggestionComponent(thread.composer, {
        isActive: true,
        modelName: 'Partner',
        recordLocalId: partner.localId,
    });

    assert.containsOnce(
        document.body,
        '.o_ComposerSuggestion',
        "Partner mention suggestion should be displayed"
    );
    assert.hasClass(
        document.querySelector('.o_ComposerSuggestion'),
        'active',
        "should be active initially"
    );
});

});
});
