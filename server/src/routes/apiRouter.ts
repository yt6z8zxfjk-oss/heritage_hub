import { Router } from "express";
import { login } from "../controllers/authController";
import { createCategory, deleteCategory, listCategories, updateCategory } from "../controllers/categoryController";
import { createGuide, deleteGuide, listGuides, updateGuide } from "../controllers/guideController";
import { createStory, deleteStory, getStory, listStories, updateStory } from "../controllers/storyController";
import { createTrip, deleteTrip, listTrips, updateTrip } from "../controllers/tripController";
import {
  createAttraction,
  deleteAttraction,
  getAttraction,
  listAttractions,
  listDistricts,
  updateAttraction,
} from "../controllers/attractionController";
import {
  createReview,
  deleteReview,
  listReviews,
  listReviewsForAdmin,
  publishReview,
} from "../controllers/reviewController";
import {
  createMessage,
  deleteMessage,
  deleteThread,
  listMyMessages,
  listThreads,
  replyToVisitor,
} from "../controllers/messageController";
import { assistantStatus, describeAssistant, planAssistant } from "../controllers/assistantController";
import { buildRoute } from "../controllers/routeController";
import { requireAdmin } from "../middleware/requireAdmin";
import { wrap } from "../utils/wrap";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.json({ ok: true });
});

apiRouter.post("/auth/login", wrap(login));
apiRouter.get("/categories", wrap(listCategories));
apiRouter.post("/categories", requireAdmin, wrap(createCategory));
apiRouter.put("/categories/:id", requireAdmin, wrap(updateCategory));
apiRouter.delete("/categories/:id", requireAdmin, wrap(deleteCategory));

apiRouter.get("/stories", wrap(listStories));
apiRouter.get("/stories/:slug", wrap(getStory));
apiRouter.post("/stories", requireAdmin, wrap(createStory));
apiRouter.put("/stories/:id", requireAdmin, wrap(updateStory));
apiRouter.delete("/stories/:id", requireAdmin, wrap(deleteStory));

apiRouter.get("/guides", wrap(listGuides));
apiRouter.post("/guides", requireAdmin, wrap(createGuide));
apiRouter.put("/guides/:id", requireAdmin, wrap(updateGuide));
apiRouter.delete("/guides/:id", requireAdmin, wrap(deleteGuide));

apiRouter.get("/trips", wrap(listTrips));
apiRouter.post("/trips", requireAdmin, wrap(createTrip));
apiRouter.put("/trips/:id", requireAdmin, wrap(updateTrip));
apiRouter.delete("/trips/:id", requireAdmin, wrap(deleteTrip));

apiRouter.get("/districts", wrap(listDistricts));
apiRouter.get("/attractions", wrap(listAttractions));
apiRouter.get("/attractions/:id", wrap(getAttraction));
apiRouter.post("/attractions", requireAdmin, wrap(createAttraction));
apiRouter.put("/attractions/:id", requireAdmin, wrap(updateAttraction));
apiRouter.delete("/attractions/:id", requireAdmin, wrap(deleteAttraction));

apiRouter.get("/reviews", requireAdmin, wrap(listReviewsForAdmin));
apiRouter.post("/reviews/:id/publish", requireAdmin, wrap(publishReview));
apiRouter.delete("/reviews/:id", requireAdmin, wrap(deleteReview));

apiRouter.get("/attractions/:id/reviews", wrap(listReviews));
apiRouter.post("/attractions/:id/reviews", wrap(createReview));

apiRouter.get("/messages/my/:visitorId", wrap(listMyMessages));
apiRouter.post("/messages", wrap(createMessage));
apiRouter.get("/messages", requireAdmin, wrap(listThreads));
apiRouter.delete("/messages/thread/:visitorId", requireAdmin, wrap(deleteThread));
apiRouter.delete("/messages/:id", requireAdmin, wrap(deleteMessage));
apiRouter.post("/messages/reply", requireAdmin, wrap(replyToVisitor));

apiRouter.post("/routes", wrap(async (req, res) => buildRoute(req, res)));
apiRouter.get("/assistant/status", wrap(async (_req, res) => assistantStatus(_req, res)));
apiRouter.post("/assistant/plan", wrap(planAssistant));
apiRouter.post("/assistant/describe", wrap(describeAssistant));

apiRouter.use((_req, res) => {
  res.status(404).json({ message: "Маршрут не найден" });
});
