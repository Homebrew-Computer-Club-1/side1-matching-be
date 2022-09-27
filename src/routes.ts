import { Router } from 'express';

const router: Router = Router();

router.get('/route-1', function(req, res){
    res.send('This is route-1');
});

module.exports = router;