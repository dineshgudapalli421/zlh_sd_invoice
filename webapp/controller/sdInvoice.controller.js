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
    "sap/base/security/URLWhitelist"
], (Controller, ODataModel, Filter, FilterOperator, JSONModel, MessageBox, Fragment, PDFViewer, Dialog, Button, URLWhitelist) => {
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
                SDInvoice: []
            });
            oController.getView().setModel(oSDInvoiceModel, "SDInvoiceModel");
            oRouter.getRoute("RoutesdInvoice").attachPatternMatched(oController._onRouteMatch, oController);
        },
        _onRouteMatch: function (oEvent) {
            debugger;
           var oSDInvoiceModel = oController.getView().getModel("SDInvoiceModel");
            var oModel = oController.getOwnerComponent().getModel();
            var aFilter = [];            
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

        onSearch: function () {
            debugger;
            const oView = this.getView();
            var oTable = oController.getView().byId("tblSDInvoicePreview");
            var oJsonModel = new sap.ui.model.json.JSONModel();
            var oSDInvoiceModel = oController.getView().getModel("SDInvoiceModel");
            var aFilter = [];
            const contractAccount = this.getView().byId("idCA").getValue();
            // if (contractAccount === "") {
            //     oJsonModel.setData({});
            //     oSDInvoiceModel.setProperty("/SDInvoice", oJsonModel);
            //    // oController.getView().byId("tblSDInvoicePreview").setModel(oJsonModel, "SDInvoiceModel");
            //     return MessageBox.error("Contract Account is mandatory...");
            // }

            if (contractAccount !== "") {
                aFilter.push(new Filter("vkont", FilterOperator.EQ, contractAccount));
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
                        // oJsonModel.setData(response.results);
                        // oView.byId("tblSDInvoicePreview").setModel(oJsonModel, "SDInvoiceModel");
                        // oTable.clearSelection(true);
                    }
                    else if (response.results.length === 0) {
                        oSDInvoiceModel.setProperty("/SDInvoice", {});
                        // oJsonModel.setData({});
                        // oView.byId("tblSDInvoicePreview").setModel(oJsonModel);
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

            //this.switchState("Navigation");

        },
        onPressInvoice: function (oEvent) {
            debugger;
            let oSource = oEvent.getSource();
            let oInvoiceNo = oSource.getText();
            if (oInvoiceNo) {
                //var oModel = oController.getOwnerComponent.getModel("PDFPreviewService");
                var sEntityPath = "/Print_previewSet('" + oInvoiceNo + "')/$value";
                oPDFModel.read(sEntityPath, {
                    success: function (oData, oResponse) {
                        debugger;
                        var sContentType = oResponse.headers["content-type"] || "application/pdf";
                        var sBase64Data = oData;
                        var sFileName = oResponse.headers["content-disposition"]?.match(/filename="(.+)"/)?.[1] || "document.pdf";
                        var decodedPdfContent = atob(sBase64Data);
                        var byteArray = new Uint8Array(decodedPdfContent.length);
                        for (var i = 0; i < decodedPdfContent.length; i++) {
                            byteArray[i] = decodedPdfContent.charCodeAt(i);
                        }
                        var oBlob = new Blob([byteArray.buffer], { type: sContentType });
                        var sPdfUrl = URL.createObjectURL(oBlob);
                        URLWhitelist.add("blob");

                        var oPDFViewer = new PDFViewer({
                            source: sPdfUrl,
                            title: sFileName,
                            height: "600px"
                        })
                        oPDFViewer.open();
                    }.bind(oController),
                    error: function (oError) {
                        MessageBox.error("Error loading PDF: ",  oError.message);
                    }
                })
            }
        }
    });
});