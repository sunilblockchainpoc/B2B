pragma solidity ^0.4.18;

contract ShipmentContract {

    address owner;
    
    function ShipmentContract() public {
        owner = msg.sender;
    }

    modifier onlySeller() {
        require(tx.origin == owner);
        _;
    }

    modifier onlyShipper() {
        require(msg.sender != owner);
        _;
    }

    enum ShipmentStatus {
        Unknown,
        Received,
        Shipped,
        Failed,
        Delivered,
        Acknowledged
    }

    struct ShipmentDetail {
        uint packageID;
        string shipmentDescription;
        uint shipmentID;
        uint shipmentDate;
        ShipmentStatus status;
        string shipmentReceiptFileName;
        string shipmentReceiptFileHash;
    }

    mapping (uint=>ShipmentDetail) shipmentDetails;
    mapping (uint=>uint) packageIDtoShipmentID;

    uint SHIPMENT_COUNTER;
    string emptyString = "";
    event ShipmentRequested(uint packageID,uint shipmentID,bool status);
    event ShipmentStatusUpdate(uint shipmentID, ShipmentStatus status,bool isSuccess);


    // This method is used by Seller to ship the product
    function requestForShipment(uint packageID,string shipmentDescription)  onlySeller public {
        shipmentDetails[SHIPMENT_COUNTER] = ShipmentDetail(packageID,shipmentDescription,SHIPMENT_COUNTER+1,0,ShipmentStatus.Received,emptyString,emptyString);
        // Successful Shipment creation
        packageIDtoShipmentID[packageID] = SHIPMENT_COUNTER+1;
        ShipmentRequested(packageID,SHIPMENT_COUNTER+1,true);
        SHIPMENT_COUNTER++;
    }

    // This method returns all the shipment created.
    function getShipmentCount() view public returns (uint shipmentCount) {
        return SHIPMENT_COUNTER;
    }

    // This method returns all the shipment created.
    function getShipmentDetail(uint shipmentID) view public returns (uint shipmentNo,uint packageID,string shipmentDescription,uint shipmentDate,ShipmentStatus status,string shipmentReceiptFileName,string shipmentReceiptFileHash) {

        require(shipmentID > 0);
        uint index = shipmentID - 1;

        shipmentNo = shipmentDetails[index].shipmentID;
        packageID = shipmentDetails[index].packageID;
        shipmentDescription = shipmentDetails[index].shipmentDescription;
        shipmentDate = shipmentDetails[index].shipmentDate;
        status = shipmentDetails[index].status;
        shipmentReceiptFileName = shipmentDetails[index].shipmentReceiptFileName;
        shipmentReceiptFileHash = shipmentDetails[index].shipmentReceiptFileHash;
        
        return;
    }

    // This method returns shipment details based on package ID. Used by buyer and seller
    function getShipmentDetailByPackageID(uint packageID) view public returns (string shipmentDescription,uint shipmentDate,ShipmentStatus status,string shipmentReceiptFileName,string shipmentReceiptFileHash) {

        uint shipmentID = packageIDtoShipmentID[packageID];
        assert(shipmentID>0);

        uint index = shipmentID - 1;
        shipmentDescription = shipmentDetails[index].shipmentDescription;
        shipmentDate = shipmentDetails[index].shipmentDate;
        status = shipmentDetails[index].status;
        shipmentReceiptFileName = shipmentDetails[index].shipmentReceiptFileName;
        shipmentReceiptFileHash = shipmentDetails[index].shipmentReceiptFileHash;
        return;
    }

    // This method returns shipment details based on package ID. Used by buyer and seller
    function getShipmentIDByPackageID(uint packageID) view public returns (uint shipmentID) {
        shipmentID = packageIDtoShipmentID[packageID];
    }

    // This method is used to update shipment details
    function updateShipmentDetails(uint packageID,uint shipmentDate,ShipmentStatus status,string shipmentReceiptFileName,string shipmentReceiptFileHash) onlyShipper public {

        uint shipmentID = packageIDtoShipmentID[packageID];
        assert(shipmentID>0);

        uint index = shipmentID - 1;
       
        if (shipmentDetails[index].packageID==packageID) { 
            shipmentDetails[index].shipmentDate = shipmentDate;
            shipmentDetails[index].status = status;
            shipmentDetails[index].shipmentReceiptFileName = shipmentReceiptFileName;
            shipmentDetails[index].shipmentReceiptFileHash = shipmentReceiptFileHash;
        }
    }

    // This method is used to update shipment status
    function updateShipmentStatus(uint shipmentID, ShipmentStatus status) public {

        require(shipmentID > 0);
        uint index = shipmentID - 1;
        
        if (shipmentDetails[index].shipmentID==shipmentID) { 
            shipmentDetails[index].status = status;
            ShipmentStatusUpdate(shipmentID, status,true);
        } else {
            ShipmentStatusUpdate(shipmentID, status,false);
        }
    }

    /************************************ Utility Functions *************************************************/
    function stringsEqual(string storage _a, string memory _b) view internal returns (bool) {
		bytes storage a = bytes(_a);
		bytes memory b = bytes(_b);
		if (a.length != b.length)
			return false;
		for (uint i = 0; i < a.length; i ++) {
			if (a[i] != b[i]) {
				return false;
            }
        }
		return true;
	}
}
