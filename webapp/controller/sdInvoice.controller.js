sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/odata/v2/ODataModel",
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    "sap/ui/model/json/JSONModel",
    'sap/m/MessageBox',
    "sap/ui/core/Fragment",
    "sap/m/PDFViewer",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/base/security/URLWhitelist",
    "sap/ui/core/format/DateFormat"
], (Controller, ODataModel, Filter, FilterOperator, JSONModel, MessageBox, Fragment, PDFViewer, Dialog, Button, URLWhitelist, DateFormat) => {
    "use strict";
    var oRouter, oController, oPDFModel, UIComponent, oCorrespTypeModel;
    return Controller.extend("com.sap.lh.mr.zlhsdinvoice.controller.sdInvoice", {
        onInit() {
            debugger;
            oController = this;
            UIComponent = oController.getOwnerComponent();
            oPDFModel = oController.getOwnerComponent().getModel("PDFPreviewService");
            oRouter = UIComponent.getRouter();
            var oSDInvoiceModel = new JSONModel({
                oInvoicePDF: "",
                SDInvoice: []
            });
            oController.getView().setModel(oSDInvoiceModel, "SDInvoiceModel");
            if (sap.ushell && sap.ushell.Container && sap.ushell.Container.getRenderer("fiori2")) {
                sap.ushell.Container.getRenderer("fiori2").setHeaderVisibility(false, true);
            }
            oRouter.getRoute("RoutesdInvoice").attachPatternMatched(oController._onRouteMatch, oController);
        },
        _onRouteMatch: function (oEvent) {
            debugger;
            var oComponentData = UIComponent.getComponentData();
            var contractAccount = '';
            if (oComponentData && oComponentData.startupParameters) {
                var oParams = oComponentData.startupParameters;
                contractAccount = oParams.ContractAccount[0];
                if (contractAccount) {
                    oController.getView().byId("idCA").setValue(contractAccount);
                }
            }
            var oSDInvoiceModel = oController.getView().getModel("SDInvoiceModel");
            var oModel = oController.getOwnerComponent().getModel();
            var aFilter = [];
            if (contractAccount) {
                aFilter.push(new Filter("vkont", FilterOperator.EQ, contractAccount));
            }
            oModel.read("/ZC_CN_SUN_INV_APL_CON", {
                filters: aFilter,
                success: function (response) {
                    if (response.results.length > 0) {
                        oSDInvoiceModel.setProperty("/SDInvoice", response.results);
                    }
                    else if (response.results.length === 0) {
                        oSDInvoiceModel.setProperty("/SDInvoice", {});
                    }
                },
                error: (oError) => {
                    oSDInvoiceModel.setProperty("/SDInvoice", {});
                    MessageBox.error("Error loading records : " + oError.message);
                }
            });
        },

        getDateFormat: function (strDate) {

            var oDateFormat = DateFormat.getInstance({
                UTC: false,
                pattern: "yyyy-MM-dd"
            });
            var formatDate = oDateFormat.format(new Date(strDate));
            return formatDate.toString();
        },

        onSearch: function () {
            debugger;
            const oView = this.getView();
            var oTable = oController.getView().byId("tblSDInvoicePreview");
            var oJsonModel = new sap.ui.model.json.JSONModel();
            var oSDInvoiceModel = oController.getView().getModel("SDInvoiceModel");
            var aFilter = [];
            const contractAccount = this.getView().byId("idCA").getValue();
            const fromDate = this.getView().byId("idDTP1").getValue();
            const toDate = this.getView().byId("idDTP2").getValue();

            if (contractAccount !== "") {
                aFilter.push(new Filter("vkont", FilterOperator.EQ, contractAccount));
            }
            if (fromDate !== "" && toDate !== "") {
                let billingfrom = this.getDateFormat(this.byId("idDTP1").getDateValue());
                let billingTo = this.getDateFormat(this.byId("idDTP2").getDateValue());
                aFilter.push(new Filter("fkdat", FilterOperator.BT, billingfrom, billingTo));
            }
            var oModel = oController.getOwnerComponent().getModel();
            var oBusyDialog = new sap.m.BusyDialog({
                title: "Loading Data",
                text: "Please wait..."
            });
            oBusyDialog.open();
            oModel.read("/ZC_CN_SUN_INV_APL_CON", {
                filters: aFilter,
                success: function (response) {
                    oBusyDialog.close();
                    if (response.results.length > 0) {
                        oSDInvoiceModel.setProperty("/SDInvoice", response.results);
                    }
                    else if (response.results.length === 0) {
                        oSDInvoiceModel.setProperty("/SDInvoice", {});
                        return MessageBox.error("There are no records with selection.")
                    }
                },
                error: (oError) => {
                    oBusyDialog.close();
                    oJsonModel.setData({});
                    oView.byId("tblSDInvoicePreview").setModel(oJsonModel);
                    var oResponseText = oError.responseText;
                    var sParsedResponse = JSON.parse(oResponseText);
                    const oMessage = sParsedResponse.error.message.value;
                    return MessageBox.error(oMessage);
                }
            });


        },
        onPressInvoice: function (oEvent) {
            debugger;
            let oSourceValue = oEvent.getSource();
            let oInvoiceNo = oSourceValue.getText();
            if (oInvoiceNo) {
                var oSource = "/sap/opu/odata/SAP/ZBI_PRINT_PREVIEW_SRV/Print_previewSet('" + oInvoiceNo + "')/$value";
                var oPdfViewer = new PDFViewer({
                    title: "Sundry Invoice",
                    height: "600px"
                });
                oPdfViewer.setSource(oSource);
                var pdfUrl = oPdfViewer.getSource();
                window.open(pdfUrl, "_blank");
                //oPdfViewer.open();

            }
        },
        onCloseDialogPDF: function () {
            this.oPdfDialog.close();
        },
    });
});