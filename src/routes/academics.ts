// routes/academics.ts
import { Router, Request, Response, NextFunction } from 'express';
import { createClient } from '../utils/database/server-database';
import { calculateAgeFromDOB, createEditableFromTemplate } from '../utils/checklist';

const router = Router();

// Extend Request type to include user
interface AuthedRequest extends Request {
  user?: any;
}

// requireAuth middleware
async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const supabase = createClient({ req, res });
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    return res.redirect('/login');
  }
  req.user = data.user;
  next();
}

router.use(requireAuth);

// GET academics page
router.get('/:childId', async (req: AuthedRequest, res: Response) => {
  const supabase = createClient({ req, res });
  const childId = req.params.childId;

  try {
    // Fetch child basic info
    const { data: child, error: childErr } = await supabase
      .from('Children')
      .select('id, name, dob')
      .eq('id', childId)
      .single();

    if (childErr || !child) {
      return res.status(404).send('Child not found');
    }

    const age = calculateAgeFromDOB(child.dob);

    // Check if checklist already exists
    const { data: existing, error: checklistErr } = await supabase
      .from('child_checklists')
      .select('*')
      .eq('child_id', childId)
      .maybeSingle();

    let checklist, templateAge;

    if (existing) {
      checklist = existing.content;
      templateAge = existing.template_age;
    } else {
      // Load template for age
      const { data: tpl, error: tplErr } = await supabase
        .from('checklist_templates')
        .select('checklist, age')
        .eq('age', Math.max(3, Math.min(18, age)))
        .single();

      if (tplErr || !tpl) {
        return res.status(500).send('No template found');
      }

      // Convert template into editable checklist
      const editable = createEditableFromTemplate(tpl.checklist);

      const { data: inserted, error: insertErr } = await supabase
        .from('child_checklists')
        .insert([{ child_id: childId, template_age: tpl.age, content: editable }])
        .select()
        .single();

      if (insertErr || !inserted) {
        return res.status(500).send('Failed to create checklist');
      }

      checklist = inserted.content;
      templateAge = tpl.age;
    }

    // Render academics view
    res.render('academics', {
      layout: 'acad-base',
      child,
      age,
      checklist,
      templateAge
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});


// POST save
router.post('/:childId/save', async (req: AuthedRequest, res: Response) => {
  const supabase = createClient({ req, res });
  const childId = req.params.childId;
  const { content, note } = req.body;
  try {
    if (!Array.isArray(content) || content.length > 200) {
      return res.status(400).json({ ok: false, error: 'Invalid content' });
    }

    const { data: existing } = await supabase
      .from('child_checklists')
      .select('*')
      .eq('child_id', childId)
      .maybeSingle();

    if (existing) {
      const { data: updated } = await supabase
        .from('child_checklists')
        .update({ content, meta: { editedBy: req.user?.id, note }, updated_at: new Date().toISOString() })
        .eq('child_id', childId)
        .select()
        .single();

      await supabase.from('child_checklist_history').insert([{
        child_checklist_id: updated.id,
        content,
        changed_by: req.user?.id
      }]);

      return res.json({ ok: true, checklist: updated.content });
    } else {
      const { data: inserted } = await supabase
        .from('child_checklists')
        .insert([{
          child_id: childId,
          template_age: Math.max(3, Math.min(18, calculateAgeFromDOB(req.body.dob || new Date()))),
          content,
          meta: { editedBy: req.user?.id, note }
        }])
        .select()
        .single();

      await supabase.from('child_checklist_history').insert([{
        child_checklist_id: inserted.id,
        content,
        changed_by: req.user?.id
      }]);

      return res.json({ ok: true, checklist: inserted.content });
    }
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message || err });
  }
});

export default router;
