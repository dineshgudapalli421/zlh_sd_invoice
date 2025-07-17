/*global QUnit*/

sap.ui.define([
	"com/sap/lh/mr/zlhsdinvoice/controller/sdInvoice.controller"
], function (Controller) {
	"use strict";

	QUnit.module("sdInvoice Controller");

	QUnit.test("I should test the sdInvoice controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
