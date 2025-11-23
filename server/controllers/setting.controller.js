const Setting = require('../models/setting.model');

// @desc    Get a setting by key (public)
const getSetting = async (req, res) => {
  try {
    const setting = await Setting.findOne({ key: req.params.key });
    if (!setting) {
      // Return a default empty value if not found, to prevent frontend errors
      return res.json({ key: req.params.key, value: '' });
    }
    res.json(setting);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Create or update a setting (admin)
const updateSetting = async (req, res) => {
  const { key, value } = req.body;

  if (!key) {
    return res.status(400).json({ msg: 'Key is required.' });
  }

  try {
    // Use upsert option to create if it doesn't exist, or update if it does.
    const setting = await Setting.findOneAndUpdate(
      { key },
      { value },
      { new: true, upsert: true }
    );
    res.json(setting);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

module.exports = {
  getSetting,
  updateSetting,
};
