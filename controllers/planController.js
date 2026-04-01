import Plan from '../models/Plan.js';

export const getPlans = async (req, res) => {
  const plans = await Plan.find({});
  res.json(plans);
};

export const createPlan = async (req, res) => {
  const { name, price, duration } = req.body;
  const plan = new Plan({ name, price, duration });
  await plan.save();
  res.status(201).json(plan);
};

export const updatePlan = async (req, res) => {
  const plan = await Plan.findById(req.params.id);
  if (plan) {
    plan.name = req.body.name || plan.name;
    plan.price = req.body.price || plan.price;
    plan.duration = req.body.duration || plan.duration;
    const updatedPlan = await plan.save();
    res.json(updatedPlan);
  } else {
    res.status(404).json({ message: 'Plan not found' });
  }
};

export const deletePlan = async (req, res) => {
  const plan = await Plan.findById(req.params.id);
  if (plan) {
    await plan.deleteOne();
    res.json({ message: 'Plan removed' });
  } else {
    res.status(404).json({ message: 'Plan not found' });
  }
};
