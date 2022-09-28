import { Router } from 'express';
export const router = Router();
router.get('/route-1', function (req, res) {
    res.send('This is route-1');
});
