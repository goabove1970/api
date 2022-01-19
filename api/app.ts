require('module-alias/register');
var express = require('express');
var bodyParser = require('body-parser');
import * as path from 'path';
var cors = require('cors');
var cookieParser = require('cookie-parser');
var createError = require('http-errors');

import * as transactionsRouter from '@routes/transactions';
import * as userRouter from '@routes/users';
import * as accountRouter from '@routes/accounts';
import * as sessionRouter from '@routes/session';
import * as categoryRouter from '@routes/categories';
import * as businessRouter from '@routes/businesses';
import * as spendingsRouter from '@routes/spendings';
import * as bankConnectionsRouter from '@routes/banks-connections';
import { logHelper } from './src/logger';

export const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: false }));
app.use(bodyParser.json({ limit: '50mb' }));

app.use('/transactions', transactionsRouter);
app.use('/users', userRouter);
app.use('/accounts', accountRouter);
app.use('/session', sessionRouter);
app.use('/categories', categoryRouter);
app.use('/business', businessRouter);
app.use('/spendings', spendingsRouter);
app.use('/bank-connections', bankConnectionsRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});

// error handler
app.use(function(error, req, res, next) {
    if (error) {
        logHelper.error(`Error: ${error.message || error}`);
    }
    // set locals, only providing error in development
    res.locals.message = error.message;
    res.locals.error = req.app.get('env') === 'development' ? error : {};
    logHelper.info('processing...');
    if (req && req.body) {
        logHelper.info(`req body: ${req.body.toString()}`);
    }
    // render the error page
    res.status(error.status || 500);
    res.render('error');
});
