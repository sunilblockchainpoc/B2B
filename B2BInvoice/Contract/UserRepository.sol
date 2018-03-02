pragma solidity ^0.4.18;
import "./RolesRepository.sol";
contract UserRepository {
    
    enum Status
    {
        Active,
        Inactive
    }
    
    struct UserProfile {
        uint32 UserProfileId;
        string UserName;
        string FirstName;
        string LastName;
        string password;
        string OrgName;
        Status UserStatus;
        uint32 ActiveDate;
        uint32 InActiveDate;
	    address peerAddress;
    }
    
    struct UserGroup {
        uint32  UserProfileId;
        uint32  GroupId;
        uint32 GroupRoleId;
        Status  UserGroupStatus;
        uint32  UserGroupActiveDate;
        uint32  UserGroupInActiveDate;
    }

    mapping (uint32 => UserProfile) users;
    mapping (uint32 => UserGroup) userGroups;

    address rolesRepositoryAddress;
    RolesRepository rolesRepository;
    uint32 MaxUserProfileId;
    uint32 MaxUserGroupId;

    event UserAdded(string firstName, string lastName, bool success);
    event UserAddedToGroup(bool success);
    event UserUpdated(string fName, string lName, bool success);
    event ErrorMessage(string errorMessage);
    event UserGroupUpdated(bool success);
    event PasswordChanged(bool success);

    function UserRepository(address _rolesRepoAddress) {
        rolesRepositoryAddress = _rolesRepoAddress;
        rolesRepository = RolesRepository(rolesRepositoryAddress);
    }

    function addUser(string userName, string fName, string lName, string password, string orgName, Status userStatus, uint32 activeDate, address nodeAddress) public {
        require(bytes(userName).length>0);
        require(bytes(fName).length>0);
        require(bytes(lName).length>0);
        require(bytes(password).length>0);
        users[MaxUserProfileId] = UserProfile(MaxUserProfileId + 1,userName, fName, lName,password, orgName, userStatus, activeDate, 0, nodeAddress);
        MaxUserProfileId++;
        UserAdded(fName, lName, true);
    }
    
    function login(string _username,string _password) public constant returns (address node, uint32[100] groupIds, uint32[100] roleIds) {
        
        for (uint32 i = 0; i<MaxUserProfileId; i++) {
            if ((stringsEqual(users[i].UserName, _username)) && (stringsEqual(users[i].password, _password))) {
                    node = users[i].peerAddress;
                    (groupIds,roleIds) = getUserGroups(users[i].UserProfileId);
                    return;
                }
        }
        ErrorMessage("Incorrect Login details");
    }

    function changePassword(string _username, string _oldpassword,string _password) public {
        
        for (uint32 i = 0; i<MaxUserProfileId; i++) {
            if ((stringsEqual(users[i].UserName, _username)) && (stringsEqual(users[i].password, _oldpassword))) {
                users[i].password = _password;
                PasswordChanged(true);
                return;
            }
        }
        PasswordChanged(false);
   }
    
    function stringsEqual(string storage _a, string memory _b) internal returns (bool) {
		bytes storage a = bytes(_a);
		bytes memory b = bytes(_b);
		if (a.length != b.length)
			return false;
		for (uint32 i = 0; i < a.length; i ++) {
			if (a[i] != b[i])
				return false;
        }
		return true;
	}

    function addUserToGroup(uint32 userProfileId, uint32 groupId, uint32 groupRoleId, Status userGroupStatus, uint32 activeDate ) {
        userGroups[MaxUserGroupId] = UserGroup(userProfileId, groupId, groupRoleId, userGroupStatus, activeDate, 0);
        MaxUserGroupId++;
        UserAddedToGroup(true);
    }

    function updateUser(uint32 userProfileId, string fName, string lName, string orgName, Status userStatus, uint32 inactiveDate) public {
        for (uint32 i = 0; i<MaxUserProfileId; i++) {
            if (users[i].UserProfileId == userProfileId) {
                users[i].FirstName = fName;
                users[i].LastName = lName;
                users[i].OrgName = orgName;
                users[i].UserStatus = userStatus;
                users[i].InActiveDate = inactiveDate;
                UserUpdated(fName, lName, true);
                return;
            }
        }
        ErrorMessage("User Profile Details not available");
    }

    function updateUserGroup(uint32 groupId, uint32 groupRoleId, Status userGroupStatus,uint32 userGroupInactiveDate) public {

        for (uint32 i = 0; i<MaxUserGroupId; i++) {

            if (userGroups[i].GroupId == groupId) {
                userGroups[i].GroupRoleId = groupRoleId;
                userGroups[i].UserGroupStatus = userGroupStatus;
                userGroups[i].UserGroupInActiveDate = userGroupInactiveDate;
                UserGroupUpdated(true);
            }
        }
    }

    function getUserProfile(uint32 userProfileId) public constant returns (string, string, string, string, Status, uint32, uint32) {

        for (uint32 i = 0; i<MaxUserProfileId; i++) {
            if (users[i].UserProfileId == userProfileId) {
                 return (users[i].UserName, users[i].FirstName, users[i].LastName, users[i].OrgName, users[i].UserStatus, users[i].ActiveDate, users[i].InActiveDate);
            } else {
                ErrorMessage("User Information no available");
            }
        }
    }

    function getCount() constant public returns(uint32, uint32) {
        return (MaxUserProfileId, MaxUserGroupId);
    }

    function getUsers (uint32 index) public constant returns  (string, string, string, Status) {

        if (users[index].UserProfileId > 0) {
            return (users[index].UserName, users[index].FirstName, users[index].LastName, users[index].UserStatus);
        }
    }

    function getUserGroups(uint32 userProfileId) public constant returns(uint32[100] groupIds,uint32[100] roleIds) {
        uint32 outIndex = 0;
        for (uint32 index = 0; index < MaxUserGroupId; index++) {
            if (userGroups[index].UserProfileId == userProfileId && userGroups[index].UserGroupStatus == Status.Active) {
                groupIds[outIndex] = userGroups[index].GroupId;
                roleIds[outIndex] = userGroups[index].GroupRoleId;
                outIndex++;
            }
        }
        return;
    }

    function getUsersInGroup(uint32 groupId) public constant returns (uint32[100] userProfileIds) {       
        uint32 index = 0;
            for (uint32 i = 0; i<MaxUserGroupId; i++) {
            if (userGroups[i].GroupId == groupId) {
                userProfileIds[index] = userGroups[i].UserProfileId;
                index++;
            }
        }
        return userProfileIds;
    }
}

