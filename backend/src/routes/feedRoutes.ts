import { Router } from 'express';
import { createPost, getFeed, toggleLike, addComment, getComments, searchPubMed } from '../controllers/feedController';
import { authenticateJWT, requireApprovedUser } from '../middleware/auth';
import { validateBody, postSchema, commentSchema } from '../middleware/validation';

const router = Router();

router.use(authenticateJWT);

router.get('/pubmed-search', searchPubMed);
router.post('/', requireApprovedUser, validateBody(postSchema), createPost);
router.get('/', getFeed);
router.post('/:id/like', requireApprovedUser, toggleLike);
router.post('/:id/comments', requireApprovedUser, validateBody(commentSchema), addComment);
router.get('/:id/comments', getComments);

export default router;
