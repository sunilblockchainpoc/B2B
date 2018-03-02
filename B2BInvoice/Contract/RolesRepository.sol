pragma solidity ^0.4.15;
contract RolesRepository {

    enum Permissions
    {
        None,
        Read,
        Write,
        Full
    }

    enum Status
    {
        Active,
        Inactive
    }
    struct Role {
        uint32 RoleId;
        string RoleCd;
        string RoleName;
        Status RoleStatus;
    }
    struct Group {
        uint32 GroupId;
        string GroupCd;
        string GroupName;
        Status GroupStatus;
    }
    struct RoleGroup {
        uint32 GroupId;
        uint32[] RoleIds;
    }
    
    struct Resource {
        uint32 ResourceId;
        string ResourceName;
        address ResourceAddress;
        Status ResourceStatus;
    }
    
    struct ACL {
        uint32 ACLId;
        uint32 GroupId;
        uint32 RoleId;
        uint32 ResourceId;
        Permissions Permission;
    }
    
    address Administrator;
    uint32 MaxRoleId;
    uint32 MaxGroupId;
    uint32 MaxResourceId;
    uint32 MaxRoleGroupsId;
    uint32 MaxACLId;
    uint32[] rolearr;
    

    mapping(uint32 => Role) Roles;
    mapping(uint32 => Group) Groups;
    mapping(uint32 => Resource) Resources;
    mapping(uint32 => RoleGroup) RoleGroups;
    mapping(uint32 => ACL) AccessList;

    event RoleAdded(string roleCode, string roleName);
    event GroupAdded(string groupCode, string groupName);
    event ResourceAdded(string resourceName, address resourceAddress);
    event RoleAddedToGroup(bool roleAddedToGroup);
    event AccessAssignedToGroup(bool accessAssigned);
    event RoleUpdated(string roleCode, string roleName, Status roleStatus);
    event GroupUpdated(string groupCode, string groupName, Status groupStatus);
    event ResourceUpdated(string resourceName, address resourceAddress, Status resourceStatus);
    event RoleInGroupUpdated(bool updated);
    event ErrorMessage(string errorMessage);

    function RolesRepository() {
        Administrator = msg.sender; 
        Roles[MaxRoleId] = Role(MaxRoleId + 1,"ADMIN","Administrator",Status.Active);
        Groups[MaxGroupId] = Group(MaxGroupId + 1,"G_ADMIN","Administrators",Status.Active);
        rolearr.push(MaxRoleId);
        RoleGroups[MaxRoleGroupsId] = RoleGroup(MaxGroupId,rolearr);
        MaxRoleId++;
        MaxGroupId++;
        MaxRoleGroupsId++;
        rolearr.length = 0;
        delete rolearr;
    }

     modifier onlyAdmin() {
        require(msg.sender == Administrator);
        _;
    }
    modifier checkActiveStatus (Status status) {
        require(status==Status.Active);
        _;
    }
    
    function addRole(string roleCode, string roleName, Status roleStatus) onlyAdmin checkActiveStatus(roleStatus) public {

        Roles[MaxRoleId] = Role(MaxRoleId + 1, roleCode, roleName, roleStatus);
        MaxRoleId++;
        RoleAdded(roleCode, roleName);
    }
    
    function addGroup(string groupCode, string groupName, Status groupStatus) onlyAdmin checkActiveStatus(groupStatus) public {
     Groups[MaxGroupId] = Group(MaxGroupId + 1, groupCode, groupName, groupStatus);
     MaxGroupId++;
     GroupAdded(groupCode, groupName);
    }

    function addResource(string resourceName, address resourceAddress, Status resourceStatus) onlyAdmin checkActiveStatus(resourceStatus) public {

         Resources[MaxResourceId] = Resource(MaxResourceId + 1, resourceName, resourceAddress, resourceStatus);
         MaxResourceId++;
         ResourceAdded(resourceName, resourceAddress);
    }

    function addRolesToGroup(uint32 groupId, uint32 roleId) public {
        bool groupExists;
        for (uint32 i = 0; i < MaxRoleGroupsId;i++) {
            if (RoleGroups[i].GroupId == groupId) {
                groupExists = true;
                RoleGroups[i].RoleIds.push(roleId);
                RoleAddedToGroup(true);
                return;
            }
        }
        if (!groupExists) {
            assert(rolearr.length==0);
            rolearr.push(roleId);
            RoleGroups[MaxRoleGroupsId] = RoleGroup(groupId,rolearr);
            MaxRoleGroupsId++;
            rolearr.length = 0;
            delete rolearr;
            //assert(rolearr.length==0);
            RoleAddedToGroup(true);
        }
    }
    
    function addGroupAccessList(uint32 groupId, uint32 roleId, uint32 resourceId, Permissions accessPermission) onlyAdmin public {
        AccessList[MaxACLId] = ACL(MaxACLId + 1,groupId,roleId,resourceId,accessPermission);
        MaxACLId++;
        AccessAssignedToGroup(true);
    }

    //Returns RoleId, GroupId, ResourceId, RoleGroupsId, AccessListId in the same order for counts
    function getCount() constant public returns(uint32, uint32, uint32, uint32, uint32) {
        return (MaxRoleId, MaxGroupId, MaxResourceId, MaxRoleGroupsId, MaxACLId);
    }
    
    function updateRole(uint32 roleId, string roleCode, string roleName, Status roleStatus) onlyAdmin public {

        for (uint32 i = 0; i < MaxRoleId;i++) {
            if (Roles[i].RoleId == roleId ) {

                Roles[i].RoleName = roleName;
                Roles[i].RoleCd = roleCode;
                Roles[i].RoleStatus = roleStatus;
                RoleUpdated(roleCode,roleName, roleStatus);
                return;
            }
        }
        ErrorMessage ("Error updating Role Details");

    } 

    function updateGroup(uint32 groupId, string groupCode, string groupName, Status groupStatus) onlyAdmin public {

        for (uint32 i = 0; i < MaxGroupId;i++) {
            if (Groups[i].GroupId == groupId ) {

                Groups[i].GroupName = groupName;
                Groups[i].GroupCd = groupCode;
                Groups[i].GroupStatus = groupStatus;
                GroupUpdated(groupCode,groupName, groupStatus);
                return;
            }
        }
        ErrorMessage ("Error updating Group Details");

    }

    function updateRoleGroup(uint32 groupId, uint32[] roleIds) onlyAdmin public {
        for (uint32 i = 0;i < MaxRoleGroupsId; i++) {
            if (RoleGroups[i].GroupId == groupId) {
                if (RoleGroups[i].RoleIds.length > 0) {
                    for (uint32 j = 0;j < roleIds.length; j++) {
                        for (uint32 k = 0; k < RoleGroups[i].RoleIds.length; k++) {
                            if (roleIds[j] == RoleGroups[i].RoleIds[k]) {
                                delete RoleGroups[i].RoleIds[k];
                            }
                        }
                    }
                } else {
                    ErrorMessage ("No roles have been assigned to the group");
                }
            }
        }
        RoleInGroupUpdated(true);
    }

    function updateResource(uint32 resourceId, string resourceName, address resourceAddress, Status resourceStatus) onlyAdmin public {
        for (uint32 i = 0; i < MaxResourceId;i++) {
            if (Resources[i].ResourceId == resourceId ) {
                Resources[i].ResourceName = resourceName;
                Resources[i].ResourceAddress = resourceAddress;
                Resources[i].ResourceStatus = resourceStatus;
                ResourceUpdated(resourceName,resourceAddress, resourceStatus);
                return;
            }
        }
        ErrorMessage ("Error updating Group Details");
    }
    
    function updateGroupAccessPermission(uint32 accessListId, uint32 groupId, uint32 resourceId, Permissions accessPermission) onlyAdmin public {
        for (uint32 i = 0;i < MaxACLId; i++) {
            if (AccessList[i].ACLId == accessListId && AccessList[i].GroupId == groupId && AccessList[i].ResourceId == resourceId ) {
                AccessList[i].Permission = accessPermission;
            }
        }
    }

    function removeGroupAccessPermission(uint32 accessListId, uint32 groupId, uint32 resourceId) onlyAdmin public {
        for (uint32 i = 0;i < MaxACLId; i++) {
            if (AccessList[i].ACLId == accessListId && AccessList[i].GroupId == groupId && AccessList[i].ResourceId == resourceId ) {
                delete AccessList[i];
            }
        }
    }

    function getRoles(uint32 index) public constant returns (uint32 roleId, string roleCode, string roleName, Status roleStatus) {

       if (Roles[index].RoleId>0) { 
            roleId = Roles[index].RoleId;
            roleCode = Roles[index].RoleCd;
            roleName = Roles[index].RoleName;
            roleStatus = Roles[index].RoleStatus;
            return (roleId, roleCode, roleName, roleStatus);
        } else { 
            ErrorMessage("Role Details not found"); 
        }
    }

    function getGroups(uint32 index) public constant returns (uint32 groupId, string groupCode, string groupName, Status groupStatus) {

       if (Groups[index].GroupId>0) { 
            groupId = Groups[index].GroupId;
            groupCode = Groups[index].GroupCd;
            groupName = Groups[index].GroupName;
            groupStatus = Groups[index].GroupStatus;
            return (groupId, groupCode, groupName, groupStatus);
        } else { 
            ErrorMessage("Group Details not found"); 
        }
    }

    function getResources(uint32 index) public constant returns (uint32 resourceId, string resourceName, address resourceAddress, Status resourceStatus) {

       if (bytes(Resources[index].ResourceName).length>0) { 
            resourceId = Resources[index].ResourceId;
            resourceName = Resources[index].ResourceName;
            resourceAddress = Resources[index].ResourceAddress;
            resourceStatus = Resources[index].ResourceStatus;
            return (resourceId, resourceName, resourceAddress, resourceStatus);
        } else { 
            ErrorMessage("Resource Details not found"); 
        }
    }
     
    function getAccessControlList(uint32 index) public constant returns (uint32 accessListId, uint32 groupId, uint32 resourceId, Permissions accessPermission) {

       if (AccessList[index].GroupId>0) { 
            accessListId = AccessList[index].ACLId;
            resourceId = AccessList[index].ResourceId;
            groupId = AccessList[index].GroupId;
            accessPermission = AccessList[index].Permission;
            return (accessListId, groupId, resourceId, accessPermission);
        } else { 
            ErrorMessage("Access Control Details not found"); 
        }
    }

    function getRolesInGroup(uint32 index) public constant returns (uint32 groupId, uint32[100] roleIds) {

        if (RoleGroups[index].GroupId > 0 && RoleGroups[index].RoleIds.length > 0) {
            groupId = RoleGroups[index].GroupId;
            for (uint32 i = 0; i < 100; i++) {
                if (RoleGroups[index].RoleIds[i]>0) {
                    roleIds[i] = RoleGroups[index].RoleIds[i];
                }
            }
            return (groupId, roleIds);
        } else {
            ErrorMessage("Roles in group information not available");
        }
    }

    function getRolesByGroupId(uint32 groupId) public constant returns (uint32[100] roleIds) {
        uint32 outIndex = 0;
        for (uint32 index = 0; index < MaxRoleGroupsId;index++) {
            if (RoleGroups[index].GroupId == groupId) {
                for (uint32 roleCount = 0; roleCount < RoleGroups[index].RoleIds.length && roleCount <= 100;roleCount++) {
                        roleIds[outIndex] = RoleGroups[index].RoleIds[roleCount];
                }
            }
        
        }
        return roleIds;
    }
}
