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
    res.status(500).json({ message: 'Server error' });
};

// @desc    Create a new group
// @route   POST /api/groups
// @access  Private
const createGroup = async (req, res) => {
    const { name, type, members } = req.body;
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
            return res.status(400).json({ message: 'One or more provided member IDs are invalid.' });
        }

        const newGroup = new Group({
            name,
            type,
            members: members, // Mongoose will convert strings to ObjectIds if valid
            admin: adminId
        });

        const savedGroup = await newGroup.save();

        // Optional: Update each member's user document to add this group to a 'groups' array if you add it to User schema
        // For now, we rely on querying Groups directly by user ID in the members array.

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

        const updatedGroup = await group.save(); // Using save() to trigger pre/post hooks if any
        // Alternatively, use findByIdAndUpdate if no hooks are needed and for simpler updates:
        // const updatedGroup = await Group.findByIdAndUpdate(
        //     req.params.id,
        //     { name, type, updatedAt: Date.now() },
        //     { new: true, runValidators: true }
        // ).populate('members', 'username email firstName lastName')
        // .populate('admin', 'username email firstName lastName');

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

        // TODO: Before deleting group, consider what to do with associated expenses and payments.
        // Option 1: Delete all associated expenses and payments.
        // Option 2: Mark group as inactive.
        // For simplicity, for now, we'll just delete the group.
        // In a real app, you'd want to handle expense deletion/archiving carefully.
        await group.deleteOne(); // Mongoose 6+ uses deleteOne()

        res.status(200).json({ message: 'Group removed' });
    } catch (error) {
        handleMongooseError(res, error);
    }
};

// @desc    Add member(s) to a group
// @route   PUT /api/groups/:id/members
// @access  Private (Admin or existing member)
const addGroupMembers = async (req, res) => {
    const { newMemberIds } = req.body; // Array of user IDs to add

    if (!newMemberIds || !Array.isArray(newMemberIds) || newMemberIds.length === 0) {
        return res.status(400).json({ message: 'Please provide an array of new member IDs.' });
    }

    try {
        const group = await Group.findById(req.params.id);

        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        // Check if the current user is a member or admin of the group
        if (!group.members.some(member => member.equals(req.user._id))) {
            return res.status(403).json({ message: 'Not authorized to add members to this group.' });
        }

        // Validate if new member IDs are actual users
        const existingNewUsers = await User.find({ '_id': { $in: newMemberIds } });
        if (existingNewUsers.length !== newMemberIds.length) {
            return res.status(400).json({ message: 'One or more provided new member IDs are invalid users.' });
        }

        const addedMembers = [];
        for (const memberId of newMemberIds) {
            // Check if member already exists in the group
            if (!group.members.some(m => m.equals(memberId))) {
                group.members.push(memberId);
                addedMembers.push(memberId);
            }
        }

        if (addedMembers.length === 0) {
             return res.status(400).json({ message: 'All provided users are already members of this group.' });
        }

        group.updatedAt = Date.now();
        const updatedGroup = await group.save(); // Use save to trigger potential hooks, and persist changes

        // Populate the added members in the response
        const populatedGroup = await Group.findById(updatedGroup._id)
                                          .populate('members', 'username email firstName lastName')
                                          .populate('admin', 'username email firstName lastName');

        res.status(200).json(populatedGroup);

    } catch (error) {
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

        // Ensure admin cannot remove themselves if they are the only admin.
        // More complex logic needed if multiple admins or changing admin.
        if (memberIdsToRemove.includes(group.admin.toString())) {
             // If the admin is the only person who can remove, prevent self-removal
             // if they are the *only* admin. Or force transfer adminship first.
             // For now, disallow admin self-removal via this route.
             return res.status(400).json({ message: 'Cannot remove group admin directly via this route. Admin must transfer ownership first.' });
        }

        const initialMemberCount = group.members.length;
        group.members = group.members.filter(member => !memberIdsToRemove.includes(member.toString()));

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