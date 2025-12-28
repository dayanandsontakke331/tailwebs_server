exports.RouteGroup = function (endpoints, middleware) {
  let group = endpoints;

  if (middleware && middleware.length > 0) {
    middleware.forEach(function (mw) {
      group.use(mw);
    });
  }

  return group;
};
