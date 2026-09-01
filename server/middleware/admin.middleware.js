module.exports = function (req, res, next) {
  if (req.user.role !== 'admin' && req.user.role !== 'SU') {
    return res.status(403).json({ msg: 'Access denied. Admins only.' });
  }
  next();
};
