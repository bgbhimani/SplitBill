const Group = require('../models/Group');
const User = require('../models/User'); // Needed to validate members and add to user's groups

// Helper function to handle common Mongoose errors
const handleMongooseError = (res, error) => {
    console.error('Mongoose Error:', error);
    if (error.name === 'ValidationError') {
        return res.status(400).json({ message: error.message });
    }
    if (error.code === 11000) { // Duplicate key error
        return res.status(400).json({ message: 'A group with that name already exists for you.' });
    }
    // Specific handler for ObjectId cast errors
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
        return res.status(400).json({ message: `Invalid ID format for ${error.path}: ${error.value}` });
    }
    res.status(500).json({ message: 'Server error' });
};

// @desc    Create a new group
// @route   POST /api/groups
// @access  Private
const createGroup = async (req, res) => {
    const { name, type, members } = req.body; // 'members' here should still be an array of user ObjectIds
    const adminId = req.user._id; // Current authenticated user is the admin

    // Basic validation for members (ensure they are valid ObjectIds)
    if (!members || !Array.isArray(members) || members.length === 0) {
        return res.status(400).json({ message: 'Group must have at least one member.' });
    }

    // Ensure the admin (current user) is automatically a member
    if (!members.includes(adminId.toString())) {
        members.push(adminId.toString());
    }

    try {
        // Validate if all provided member IDs exist
        const existingUsers = await User.find({ '_id': { $in: members } });
        if (existingUsers.length !== members.length) {
            // This means some provided IDs are not valid ObjectIds or don't exist
            // Mongoose's CastError usually catches invalid format earlier,
            // this checks for non-existent but valid-format IDs.
            return res.status(400).json({ message: 'One or more provided member IDs are invalid or do not exist.' });
        }

        const newGroup = new Group({
            name,
            type,
            members: members, // Mongoose will convert strings to ObjectIds if valid
            admin: adminId
        });

        const savedGroup = await newGroup.save();

        res.status(201).json(savedGroup);
    } catch (error) {
        handleMongooseError(res, error);
    }
};

// @desc    Get all groups for the authenticated user
// @route   GET /api/groups
// @access  Private
const getMyGroups = async (req, res) => {
    try {
        // Find groups where the current user is a member
        const groups = await Group.find({ members: req.user._id })
                                  .populate('members', 'username email firstName lastName') // Populate member details
                                  .populate('admin', 'username email firstName lastName'); // Populate admin details
        res.status(200).json(groups);
    } catch (error) {
        handleMongooseError(res, error);
    }
};

// @desc    Get a single group by ID
// @route   GET /api/groups/:id
// @access  Private
const getGroupById = async (req, res) => {
    try {
        const group = await Group.findById(req.params.id)
                                 .populate('members', 'username email firstName lastName')
                                 .populate('admin', 'username email firstName lastName');

        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        // Check if the current user is a member of the group
        if (!group.members.some(member => member._id.equals(req.user._id))) {
            return res.status(403).json({ message: 'Not authorized to access this group' });
        }

        res.status(200).json(group);
    } catch (error) {
        handleMongooseError(res, error);
    }
};

// @desc    Update group details
// @route   PUT /api/groups/:id
// @access  Private (Admin only)
const updateGroup = async (req, res) => {
    const { name, type } = req.body; // Only allow updating name and type via this route

    try {
        let group = await Group.findById(req.params.id);

        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        // Check if the current user is the admin of the group
        if (!group.admin.equals(req.user._id)) {
            return res.status(403).json({ message: 'Not authorized to update this group (Admin only)' });
        }

        group.name = name || group.name;
        group.type = type || group.type;
        group.updatedAt = Date.now();

        const updatedGroup = await group.save();

        res.status(200).json(updatedGroup);
    } catch (error) {
        handleMongooseError(res, error);
    }
};

// @desc    Delete a group
// @route   DELETE /api/groups/:id
// @access  Private (Admin only)
const deleteGroup = async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);

        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        // Check if the current user is the admin of the group
        if (!group.admin.equals(req.user._id)) {
            return res.status(403).json({ message: 'Not authorized to delete this group (Admin only)' });
        }

        // TODO: In a real app, handle cascading deletes (expenses, payments related to this group)
        // For simplicity, for now, we'll just delete the group.
        await group.deleteOne();

        res.status(200).json({ message: 'Group removed' });
    } catch (error) {
        handleMongooseError(res, error);
    }
};

// @desc    Add member(s) to a group by their username or ID
// @route   PUT /api/groups/:id/members
// @access  Private (Admin or existing member)
const addGroupMembers = async (req, res) => {
    // newMemberIdentifiers can be an array of usernames OR user ObjectIds
    const { newMemberIdentifiers } = req.body;
    const currentUserId = req.user._id;

    if (!newMemberIdentifiers || !Array.isArray(newMemberIdentifiers) || newMemberIdentifiers.length === 0) {
        return res.status(400).json({ message: 'Please provide an array of new member usernames or IDs.' });
    }

    try {
        const group = await Group.findById(req.params.id);

        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        // Check if the current user is a member or admin of the group
        if (!group.members.some(member => member.equals(currentUserId))) {
            return res.status(403).json({ message: 'Not authorized to add members to this group.' });
        }

        // Convert provided identifiers (usernames or IDs) into actual User ObjectIds
        // Separate usernames from potential ObjectIds to avoid casting errors
        const mongoose = require('mongoose');
        const potentialIds = [];
        const usernames = [];
        
        newMemberIdentifiers.forEach(identifier => {
            if (mongoose.Types.ObjectId.isValid(identifier)) {
                potentialIds.push(identifier);
            } else {
                usernames.push(identifier);
            }
        });

        // Build the query conditions
        const queryConditions = [];
        if (usernames.length > 0) {
            queryConditions.push({ username: { $in: usernames } });
        }
        if (potentialIds.length > 0) {
            queryConditions.push({ _id: { $in: potentialIds } });
        }

        // Ensure we have at least one query condition
        if (queryConditions.length === 0) {
            return res.status(400).json({ message: 'No valid usernames or IDs provided.' });
        }

        const foundUsers = await User.find({
            $or: queryConditions
        }).select('_id username firstName lastName'); // Select necessary fields for populating response

        if (foundUsers.length !== newMemberIdentifiers.length) {
            // This indicates some identifiers didn't match any existing users
            const foundIds = foundUsers.map(u => u._id.toString());
            const missing = newMemberIdentifiers.filter(
                id => !foundIds.includes(id) && !foundUsers.some(u => u.username === id)
            );
            return res.status(400).json({ message: `One or more provided member identifiers are invalid or do not exist: ${missing.join(', ')}` });
        }

        const addedMembers = [];
        for (const user of foundUsers) {
            // Check if member already exists in the group to prevent duplicates
            if (!group.members.some(m => m.equals(user._id))) {
                group.members.push(user._id); // Add the ObjectId
                addedMembers.push(user); // Keep the populated user object for response
            }
        }

        if (addedMembers.length === 0) {
            return res.status(400).json({ message: 'All provided users are already members of this group.' });
        }

        group.updatedAt = Date.now();
        const updatedGroup = await group.save(); // Persist changes

        // Populate the entire members array in the response to include the newly added ones
        const populatedGroup = await Group.findById(updatedGroup._id)
                                          .populate('members', 'username email firstName lastName')
                                          .populate('admin', 'username email firstName lastName');

        res.status(200).json(populatedGroup);

    } catch (error) {
        // Handle CastError specifically if an invalid ObjectId format is passed for _id search
        if (error.name === 'CastError' && error.path === '_id') {
            return res.status(400).json({ message: `Invalid ID format provided for a member: ${error.value}` });
        }
        handleMongooseError(res, error);
    }
};

// @desc    Remove member(s) from a group
// @route   PUT /api/groups/:id/remove-members
// @access  Private (Admin only)
const removeGroupMembers = async (req, res) => {
    const { memberIdsToRemove } = req.body; // Array of user IDs to remove

    if (!memberIdsToRemove || !Array.isArray(memberIdsToRemove) || memberIdsToRemove.length === 0) {
        return res.status(400).json({ message: 'Please provide an array of member IDs to remove.' });
    }

    try {
        const group = await Group.findById(req.params.id);

        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        // Only the admin can remove members
        if (!group.admin.equals(req.user._id)) {
            return res.status(403).json({ message: 'Not authorized to remove members from this group (Admin only).' });
        }

        // Prevent admin from removing themselves unless there's a specific "transfer admin" logic.
        // For simplicity, disallow direct admin removal via this route.
        if (memberIdsToRemove.includes(group.admin.toString())) {
            return res.status(400).json({ message: 'Cannot remove group admin directly via this route. Admin must transfer ownership first.' });
        }

        const initialMemberCount = group.members.length;
        // Filter out members whose IDs are in memberIdsToRemove
        group.members = group.members.filter(memberId => !memberIdsToRemove.includes(memberId.toString()));

        if (group.members.length === initialMemberCount) {
            return res.status(400).json({ message: 'No specified members were found in the group or could be removed.' });
        }

        group.updatedAt = Date.now();
        const updatedGroup = await group.save();

        const populatedGroup = await Group.findById(updatedGroup._id)
                                          .populate('members', 'username email firstName lastName')
                                          .populate('admin', 'username email firstName lastName');

        res.status(200).json(populatedGroup);

    } catch (error) {
        handleMongooseError(res, error);
    }
};


module.exports = {
    createGroup,
    getMyGroups,
    getGroupById,
    updateGroup,
    deleteGroup,
    addGroupMembers,
    removeGroupMembers
};