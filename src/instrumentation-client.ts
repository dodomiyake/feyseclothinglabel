import { initBotId } from "botid/client/core";

// Invisible bot protection for the two public forms most exposed to abuse:
// enquiry submission and account sign-up. Both are server actions invoked
// from these pages, so the path below is the page, not an API route.
initBotId({
  protect: [
    { path: "/enquiry", method: "POST" },
    { path: "/sign-up", method: "POST" },
  ],
});
