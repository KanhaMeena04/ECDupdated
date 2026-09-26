const Ticket = require('../models/SupportTicket');
const { getPaginationParams, buildSearchQuery } = require('../utils/pagination');
exports.getAllTickets = async (req, res) => {
    try {
        const { page, limit, skip } = getPaginationParams(req, 50);
        const search = req.query.search || '';
        const statusFilter = req.query.status;
        const query = {};
        if (search) {
            query.$or = [
                { subject: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }
        if (statusFilter) query.status = statusFilter;
        const total = await Ticket.countDocuments(query);
        const tickets = await Ticket.find(query)
            .populate('user', 'name email mobile')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });
        res.status(200).json({
            tickets,
            total,
            page,
            limit,
            pages: Math.ceil(total / limit)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.updateTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, reply } = req.body;
        const ticket = await Ticket.findById(id);
        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
        if (status) ticket.status = status;
        if (reply) ticket.reply.push({ by: 'admin', message: reply, createdAt: new Date() });
        await ticket.save();
        res.status(200).json({ message: 'Ticket updated', ticket });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.reportIssue = async (req, res) => {
    try {
        const { orderId, description, issueType, subject, message } = req.body;
        const finalSubject = subject || issueType || (orderId ? `Order Issue: ${orderId}` : 'Customer Support Issue');
        const finalMessage = message || description || 'Issue reported by customer';
        const rawRole = req.user?.role || 'customer';
        const validRoles = ['customer', 'rider', 'restaurant_owner', 'admin'];
        const userType = validRoles.includes(rawRole) ? rawRole : 'customer';

        const ticket = await Ticket.create({
            user: req.user._id,
            userType,
            subject: finalSubject,
            message: finalMessage,
            status: 'open',
            reply: []
        });

        return res.status(201).json({
            success: true,
            message: 'Issue reported successfully',
            ticketId: ticket._id,
            ticket
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
