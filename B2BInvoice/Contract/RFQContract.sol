pragma solidity ^0.4.18;
/*
  This contract is used between Buyer and Seller. Buyer purchases the goods, seller reviews and generates PO
*/
contract RFQContract {

    address owner;

    function RFQContract() public {
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

    enum RFQStatus {
        Requested,
        Responded,
        Accepted,
        Declined
    }

    struct RFQ {
        uint rfqID;
        string requestBy;
        uint requestDt;
        RFQStatus rfqStatus;
        string responseBy;
        uint responseDt;
        uint rfqValue;
        string responseFileName;
        string responseFileHash;
    }
    mapping (uint => RFQ) RFQs;

    struct ProductSelection {
        uint rfqID;
        string reqProductFileHash;
        string resProductFileHash;
    }
    mapping (uint => ProductSelection) ProductSelectionDetails;

    uint RFQCount = 0;
    string emptyString = "";


    // Event Handling
    event RFQRequested(uint rfqID,string requestBy,bool status);
    event RFQResponded(uint rfqID,uint respondDate, bool status);
    event ErrorMessage(uint errno,string errMessage);
    event RFQstatusUpdate(uint rfqID,RFQStatus status,bool isSuccess);

    /* Buyer uses this method and initiates RFQ */
    function requestRFQ(string requestBy, uint requestDt, string reqProductFileHash ) onlyBuyer public {
        
            require(bytes(requestBy).length>0);
            require(bytes(reqProductFileHash).length>0);
            require(requestDt>0);

            RFQs[RFQCount] = RFQ(RFQCount + 1, requestBy, requestDt, RFQStatus.Requested,emptyString,0,0,emptyString,emptyString);
            ProductSelectionDetails[RFQCount] = ProductSelection(RFQCount + 1, reqProductFileHash,emptyString);

            // Make sure there is no same RFQ is defined again
            RFQRequested(RFQCount+1, requestBy,true);
            RFQCount++;
    }

    /* This method retrieves all the RFQ count */
    function getRFQCount() view public returns (uint) {
        return RFQCount;
    }

    /* Get all the RFQ Details based on the index */
    function getRFQDetail(uint rfqIndex) public view returns(uint rfqId,uint requestDt,   
                    RFQStatus status,string responseBy ,uint responseDt,uint rfqValue, string resFileName, string resFileHash,
                    string reqProductFileHash,string resProductFileHash)
    {

        // Based out of index, RFQ detail is extracted from struct
        rfqId = RFQs[rfqIndex].rfqID;
        requestDt = RFQs[rfqIndex].requestDt;
        status = RFQs[rfqIndex].rfqStatus;
        responseBy = RFQs[rfqIndex].responseBy;
        responseDt = RFQs[rfqIndex].responseDt;
        rfqValue = RFQs[rfqIndex].rfqValue;
        resFileName = RFQs[rfqIndex].responseFileName;
        resFileHash = RFQs[rfqIndex].responseFileHash;
        reqProductFileHash = ProductSelectionDetails[rfqIndex].reqProductFileHash;
        resProductFileHash = ProductSelectionDetails[rfqIndex].resProductFileHash;
        return;
    }

    /* Seller uses this method and responds back to the RFQ */
    function respondToRFQ (uint rfqId, uint rfqValue, string responseBy, uint responseDt, string resFileName, string resFileHash, string resProductFileHash, RFQStatus status) onlySeller public {

        require(bytes(responseBy).length>0);
        require(bytes(resFileName).length>0);
        require(bytes(resFileHash).length>0);
        require(responseDt>0);

        uint rfqIndex = rfqId - 1; // RFQ Number -1 becomes the  index

        if (RFQs[rfqIndex].rfqID == rfqId) {
            
            // Setting up the Response details for RFQ
            RFQs[rfqIndex].rfqValue = rfqValue;
            RFQs[rfqIndex].responseBy = responseBy;
            RFQs[rfqIndex].responseDt = responseDt;
            
            // Response File could be like a RFQ accepted agreement
            RFQs[rfqIndex].responseFileName = resFileName;
            RFQs[rfqIndex].responseFileHash = resFileHash;

            // Multiple status are possible
            RFQs[rfqIndex].rfqStatus = status; 

            // Product wise details can be updated. Currently not used
            if (ProductSelectionDetails[rfqIndex].rfqID == rfqId) {
                ProductSelectionDetails[rfqIndex].resProductFileHash = resProductFileHash;
            }
            
            RFQResponded(RFQs[rfqIndex].rfqID,RFQs[rfqIndex].responseDt,true);
        } else {
            RFQResponded(RFQs[rfqIndex].rfqID,RFQs[rfqIndex].responseDt,false);
            revert();
        }
    }

    // Buyer accepts or rejects the quote
    function acceptorDeclineQuote(RFQStatus status, uint rfqID) onlyBuyer public {

        require((RFQStatus.Accepted == status)||(RFQStatus.Declined == status));
        uint rfqIndex = rfqID - 1; // RFQ Number -1 becomes the  index

        if (RFQs[rfqIndex].rfqID == rfqID) {
            RFQs[rfqIndex].rfqStatus = status; 
            RFQstatusUpdate(RFQs[rfqIndex].rfqID,status,true);
        } else {
            RFQstatusUpdate(RFQs[rfqIndex].rfqID,status,false);
        }
    }


    /******************************* Utility Functions ****************************************/
    /* String compare - Returns false when not matching */
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