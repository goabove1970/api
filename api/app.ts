import { createError } from 'http-errors';
import { express } from 'express';
import * as path from 'path';
import { cookieParser } from 'cookie-parser';
import { logger } from 'morgan';
import { cors } from 'cors';

import * as indexRouter from '@src/routes/index';
import * as testAPIRouter from '@src/routes/testAPI';
import * as transactionsRouter from '@src/routes/transactions';

export const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
// app.use("/users", usersRouter);
app.use('/transactions', transactionsRouter);
app.use('/testAPI', testAPIRouter);

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
