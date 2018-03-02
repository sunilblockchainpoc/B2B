pragma solidity ^0.4.18;
import "./ShipmentContract.sol";

/*
  This contract is used by Seller to issue Purchase Order
*/
contract POContract {

    address owner;

    function POContract() public {
        owner = msg.sender;
    }

    modifier onlySeller() {
        require(msg.sender == owner);
        _;
    }

    modifier onlyBuyer() {
        require(msg.sender != owner);
        _;
    }

    struct PurchaseOrderDetail {
        uint rfqID;
        uint poNumber;
        string description;
        uint poReqDate;

    }

    mapping (uint=>PurchaseOrderDetail) PurchaseOrderDetails;
    mapping (uint=>uint) RFQtoPO; // RFQ to PO Number Lookup

    uint PURCHASE_ORDER_COUNTER;
    
    struct InvoiceDetail {
        uint poNumber;
        uint invoiceNumber;
        string invoiceReceiptFileName;
        string invoiceReceiptFileHash;
        uint packageID;
        string packageSlipFileName;
        string packageSlipFileHash;
    }

    mapping (uint=>InvoiceDetail) InvoiceDetails;
    
    uint INVOICE_NUMBER = 1000000;

    struct POMapping {
        uint poNumber;
        uint invoiceNumber;
        uint packageID;
    }

    mapping(uint=>POMapping) poInvoicePackage;

    uint PACKAGE_NUMBER = 9000000;

    ShipmentContract shipmentContractAddr;

    event PurchaseOrderCreated(uint rfqID,uint ponumber,bool status);
    event InvoiceCreated(uint ponumber,uint invoiceNumber,uint packageID,bool status);
    // This method is used by the buyer to create Purchase Order
    
    function createPurchaseOrder(uint rfqID,string description,uint poReqDate ) onlyBuyer public {
        
        require(rfqID>0);
        require(poReqDate>0);
        
        PurchaseOrderDetails[PURCHASE_ORDER_COUNTER] = PurchaseOrderDetail(rfqID,PURCHASE_ORDER_COUNTER+1,description,poReqDate);
       // Successful purchase order creation
        PurchaseOrderCreated(rfqID,PURCHASE_ORDER_COUNTER+1,true);
        RFQtoPO[rfqID] = PURCHASE_ORDER_COUNTER+1;
        PURCHASE_ORDER_COUNTER++;
    }

    // This method is used to get the overall PO count
    function getPurchaseOrderCount() view public returns (uint) { 
        return PURCHASE_ORDER_COUNTER;
    }

    // This method is used to get the  by PO number by RFQID
    function getPONumberByrfqID(uint rfqID) view public returns (uint poNumber) {
        return RFQtoPO[rfqID];
    }

    // This method is used to get the respective PO detail
    function getPurchaseOrderDetailByPOIndex(uint poIndex) view public returns (uint rfqID,uint poNumber, string description,uint poReqDate) {
       
        // Getting the appropriate PO details
        rfqID = PurchaseOrderDetails[poIndex].rfqID;
        poNumber = PurchaseOrderDetails[poIndex].poNumber;
        description = PurchaseOrderDetails[poIndex].description;
        poReqDate = PurchaseOrderDetails[poIndex].poReqDate;
    }

    // This method is used by Seller to generate invoice and payslip
    function createInvoice(address shipContractAddress,string packageDescription, uint poNumber,string invoiceReceiptFileName,string invoiceReceiptFileHash,string packageSlipFileName, string packageSlipFileHash ) onlySeller public {

        require(poNumber>0);
        
        InvoiceDetails[INVOICE_NUMBER-1000000] = InvoiceDetail(poNumber,INVOICE_NUMBER+1,invoiceReceiptFileName,invoiceReceiptFileHash,PACKAGE_NUMBER+1,packageSlipFileName,packageSlipFileHash);
        poInvoicePackage[poNumber] = POMapping(poNumber,INVOICE_NUMBER+1,PACKAGE_NUMBER+1);

        // Successful Invoice Generation - Event Raised
        InvoiceCreated(poNumber,INVOICE_NUMBER+1,PACKAGE_NUMBER+1,true);
        
        // Submit shipping request
        ShipmentContract contractAddr;
        contractAddr = ShipmentContract(shipContractAddress);
        contractAddr.requestForShipment(PACKAGE_NUMBER+1,packageDescription);
        INVOICE_NUMBER++;
        PACKAGE_NUMBER++;
    }

    // This method is used get the total invoice count
    function getInvoiceCount() view public returns (uint) {
        return INVOICE_NUMBER;
    }
    
    // This method is used get the invoice detail based on invoice Index
    function getInvoiceDetailsByInvoiceIndex(uint invoiceIndex) view public returns (uint poNumber, uint invoiceNumber, uint packageID, string invoiceReceiptFileName, string invoiceReceiptFileHash, string packageSlipFileName, string packageSlipFileHash) {
   
        // Getting the appropriate Invoice details
        poNumber = InvoiceDetails[invoiceIndex].poNumber;
        invoiceNumber = InvoiceDetails[invoiceIndex].invoiceNumber;
        invoiceReceiptFileName = InvoiceDetails[invoiceIndex].invoiceReceiptFileName;
        invoiceReceiptFileHash = InvoiceDetails[invoiceIndex].invoiceReceiptFileHash;
        packageID = InvoiceDetails[invoiceIndex].packageID;
        packageSlipFileName = InvoiceDetails[invoiceIndex].packageSlipFileName;
        packageSlipFileHash = InvoiceDetails[invoiceIndex].packageSlipFileHash;
    }


    // This method is used to get the Invoice number and Package ID based on PO Number
    function getInvoiceAndPackageByPO(uint poNumber) view public returns (uint invoiceNumber,uint packageID) {
        invoiceNumber = poInvoicePackage[poNumber].invoiceNumber;
        packageID = poInvoicePackage[poNumber].packageID;
    }

    /* This method is used by the shipper to extract Package Information
    function getPackageInfo(uint packageID) public view returns (string packageFile,string packageHash) {

        uint invoiceIndex = packageInvoiceMapping[packageID];
        packageFile = InoviceDetails[invoiceIndex].packageSlipFileName;
        packageHash = InoviceDetails[invoiceIndex].packageSlipFileHash;
        return;
    }*/


}