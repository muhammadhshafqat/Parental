import { Router, Request, Response, NextFunction } from "express";
import { createClient } from "../utils/database/server-database";

const dashRouter: Router = Router();

// Middleware to require authentication
async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const supabase = createClient({ req, res });
    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user) {
      return res.redirect("/login");
    }
    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    return res.redirect("/login");
  }
}

dashRouter.use(requireAuth);

// Dashboard main page – fetch children + events for logged-in user
dashRouter.get("/", async (req: Request, res: Response) => {
  const supabase = createClient({ req, res });

  try {
    // Get logged-in auth user
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr) {
      console.error("Error getting user:", userErr);
      return res.status(500).send("Server error");
    }
    const userId = userData?.user?.id;

    // Fetch row from users table
    let userRow = null;
    if (userId) {
      const { data: dbUser, error: dbErr } = await supabase
        .from("users")
        .select("id, name, email")
        .eq("id", userId)
        .single();

      if (dbErr) {
        console.error("Error fetching user row:", dbErr);
      } else {
        userRow = dbUser;
      }
    }

    let children: any[] = [];

    if (userId) {
      // Fetch children linked to this user (UserChildren -> Children)
      const { data: ucData, error: ucError } = await supabase
        .from("UserChildren")
        .select("child_id, Children(id, name, age, interests)")
        .eq("user_id", userId);

      if (ucError) {
        console.error("Error fetching UserChildren:", ucError);
      } else if (ucData) {
        children = ucData
          .map((row: any) => row.Children)
          .filter(Boolean)
          .map((c: any) => ({
            id: c.id,
            name: c.name,
            age: c.age,
            interests: Array.isArray(c.interests)
              ? c.interests
              : c.interests
              ? [c.interests]
              : [],
            events: [],
          }));

        // Fetch events for each child
        for (const child of children) {
          try {
            const { data: ceData, error: ceError } = await supabase
              .from("ChildrenEvents")
              .select("Events(id, name, location, time)")
              .eq("child_id", child.id);

            if (ceError) {
              console.error(`Error fetching events for child ${child.id}:`, ceError);
              child.events = [];
            } else if (ceData) {
              child.events = ceData
                .map((r: any) => r.Events)
                .filter(Boolean)
                .map((ev: any) => ({
                  id: ev.id,
                  name: ev.name,
                  location: ev.location,
                  time: ev.time ? new Date(ev.time).toISOString() : null,
                }));
            } else {
              child.events = [];
            }
          } catch (innerErr) {
            console.error("Inner error fetching child events:", innerErr);
            child.events = [];
          }
        }
      }
    }

    console.debug("Children prepared for render:", JSON.stringify(children));

    res.render("dashboard", {
      layout: "dashboard-base",
      children,
      firstChild: children.length > 0 ? children[0] : null,
      user: userRow, // <-- now has .name from your users table
    });
  } catch (err) {
    console.error("Dashboard route error:", err);
    try {
      return res.status(500).render("500", { title: "Server Error" });
    } catch (renderErr) {
      console.error("Error rendering 500 view:", renderErr);
      return res.status(500).send("Internal Server Error");
    }
  }
});

// Chat page
dashRouter.get("/chat", (req: Request, res: Response) => {
  res.render("chat", { layout: "dashboard-base" });
});

dashRouter.post("/chat", (req: Request, res: Response) => {
  res.sendStatus(200);
});

// Show create child form
dashRouter.get("/children", (req: Request, res: Response) => {
  res.render("enterchild", { layout: "dashboard-base", title: "Add Child" });
});

// Handle child creation form submission
dashRouter.post("/children/add", async (req: Request, res: Response) => {
  const supabase = createClient({ req, res });

  try {
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user?.id) {
      console.error("No authenticated user:", userErr);
      return res.status(401).redirect("/login");
    }
    const userId = userData.user.id;
    const userEmail = userData.user.email ?? null;
    const userName =
      userData.user.user_metadata?.full_name ??
      userData.user.user_metadata?.name ??
      null;

    const { data: upsertUser, error: upsertErr } = await supabase
      .from("users")
      .upsert({ id: userId, email: userEmail, name: userName }, { onConflict: "id" })
      .select()
      .single();

    if (upsertErr) {
      console.error("Upsert users row failed:", upsertErr);
      return res
        .status(500)
        .send("Server error creating user record. Check RLS/policies and that the request is authenticated.");
    }

    const { name, age, interests } = req.body;
    if (!name || !age) {
      return res.status(400).send("Name and age are required");
    }

    const interestsArray = interests
      ? interests.split(",").map((i: string) => i.trim())
      : [];

    const { data: child, error: insertErr } = await supabase
      .from("Children")
      .insert([{ name, age: parseInt(age, 10), interests: interestsArray }])
      .select()
      .single();

    if (insertErr || !child?.id) {
      console.error("Error inserting child:", insertErr);
      return res.status(500).send("Error creating child");
    }

    const { data: linkData, error: linkErr } = await supabase
      .from("UserChildren")
      .insert([{ user_id: userId, child_id: child.id }])
      .select()
      .single();

    if (linkErr) {
      console.error("Error linking child to user:", linkErr);
      try {
        await supabase.from("Children").delete().eq("id", child.id);
        console.debug("Rolled back child insert due to link failure.");
      } catch (delErr) {
        console.error("Failed to rollback child insert:", delErr);
      }
      return res
        .status(500)
        .send("Error linking child to user. Check that a users row exists and RLS/policies allow this operation.");
    }

    return res.redirect("/dashboard");
  } catch (err) {
    console.error("Unexpected error in /children/add:", err);
    return res.status(500).send("Internal Server Error");
  }
});

export default dashRouter;
