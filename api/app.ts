require('module-alias/register');
import { createError } from 'http-errors';
var express = require('express');
import * as path from 'path';
var logger = require('morgan');
var cors = require('cors');
var cookieParser = require('cookie-parser');

import * as indexRouter from '@routes/index';
import * as transactionsRouter from '@routes/transactions';
import * as userRouter from '@routes/users';
import * as accountRouter from '@routes/accounts';
import * as categoryRouter from '@routes/categories';
import * as businessRouter from '@routes/businesses';
// import { request } from 'https';

export const app = express();

// view engine setup
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'jade');

app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/transactions', transactionsRouter);
app.use('/users', userRouter);
app.use('/accounts', accountRouter);
app.use('/categories', categoryRouter);
app.use('/business', businessRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});
