'use strict';

(function () {
  'use strict';

  angular.module('app', ['ui.router', 'ngCookies', 'ngResource']).run(InitStates);

  InitStates.$inject = ['$rootScope', '$stateParams', '$state'];

  function InitStates($rootScope, $stateParams, $state) {
    $rootScope.$state = $state;
    $rootScope.$stateParams = $stateParams;
  }
})();
'use strict';

(function () {
  'use strict';

  angular.module('app').config(AppConfig);

  AppConfig.$inject = ['$stateProvider', '$locationProvider', '$urlRouterProvider'];

  function AppConfig($stateProvider, $locationProvider, $urlRouterProvider) {
    $locationProvider.html5Mode({
      enabled: true,
      requireBase: false
    });

    $urlRouterProvider.rule(function ($injector, $location) {
      var path = $location.url();

      if (path[path.length - 1] === '/' || path.indexOf('/?') > -1) {
        return;
      }

      if (path.indexOf('?') > -1) {
        return path.replace('?', '/?');
      }

      return path + '/';
    });

    $stateProvider.state('app', {
      url: '/',
      abstract: true,
      data: { private: false },
      views: {
        '@': {
          template: '\n              <header ui-view="header"></header>\n              <div ui-view="content" role="main"></div>\n            '
        }
      }
    }).state('app.default', {
      url: '',
      cache: false,
      data: { private: false },
      views: {
        'header@app': {
          template: '<app-header/>'
        },
        'content@app': {
          template: '<app-blogs/>'
        }
      }
    }).state('app.login', {
      url: 'admin/login/',
      cache: false,
      data: { private: false },
      views: {
        'content@app': {
          template: '<user-login/>'
        }
      }
    }).state('app.logout', {
      url: 'logout',
      cache: false,
      data: { private: false },
      views: {
        'content@app': {
          template: '',
          controller: ['$rootScope', '$cookies', '$state', '$timeout', 'context', function ($rootScope, $cookies, $state, $timeout, userContext) {
            $cookies.remove('username', { path: '/' });
            $cookies.remove('token', { path: '/' });
            userContext.setCurrentUser(null);
            $rootScope.$emit('auth::setUser');
            $state.go('app.login', { reload: true });
          }]
        }
      }
    }).state('app.profile', {
      url: 'profile',
      cache: false,
      data: { private: false },
      views: {
        'header@app': {
          template: '<app-header/>'
        },
        'content@app': {
          template: '{{ auth.currentUser.username }}'
        }
      }
    }).state('app.post', {
      url: 'post',
      cache: false,
      data: { private: false },
      views: {
        'header@app': {
          template: '<app-header/>'
        },
        'content@app': {
          template: '<app-post-blog/>'
        }
      }
    }).state('app.view', {
      url: 'view/:id/',
      cache: false,
      data: { private: false },
      views: {
        'header@app': {
          template: '<app-header/>'
        },
        'content@app': {
          template: '<app-blogs/>'
        }
      }
    });
  }
})();
'use strict';

(function () {
  'use strict';

  angular.module('app').controller('AuthCtrl', AuthController);

  AuthController.$inject = ['$scope', '$state', '$rootScope', 'context'];

  function AuthController($scope, $state, $rootScope, userContext) {
    var auth = this;

    auth.currentUser = userContext.getCurrentUser();

    // notifies the AuthController to update `currentUser` on login/logout
    $rootScope.$on('auth::setUser', function () {
      auth.currentUser = userContext.getCurrentUser();
    });
  }
})();
'use strict';

(function () {

  angular.module('app').directive('appBlogs', appBlogs);

  appBlogs.$inject = ['$rootScope'];

  function appBlogs($rootScope) {
    var directive = {
      scope: true,
      restrict: 'E',
      templateUrl: '/app/views/blogs.html',
      controller: BlogsCtrl,
      controllerAs: 'blog',
      bindToController: true,
      replace: true,
      transclude: true,
      link: function link(scope, element, attrs) {
        $rootScope.$on('$stateChangeStart', function () {
          element.remove();
          element.parent().empty();
          scope.$destroy();
        });
      }
    };

    return directive;
  }

  BlogsCtrl.$inject = ['$scope', '$state', '$stateParams', '$timeout', 'api'];

  function BlogsCtrl($scope, $state, $stateParams, $timeout, api) {
    var blog = this;

    function setInitial() {
      blog.editMode = false;
      blog.viewMode = false;
      blog.getEntry = getEntry;
      blog.getEntries = getEntries;
      blog.editEntry = editEntry;
      blog.deleteEntry = deleteEntry;
    }

    setInitial();

    // Check whether the state is not an entry view
    // then fetch entries from server
    if ($state.current.name === 'app.view') {
      blog.viewMode = true;
      blog.getEntry($stateParams.id);
    } else {
      blog.viewMode = false;
    }

    blog.getEntries();

    function getEntries() {
      api.getBlogs().then(function (data) {
        blog.entries = data;
      }, function (error) {
        blog.alert = {};
      });
    }

    function getEntry(id) {
      api.getBlog(id).then(function (data) {
        blog.entry = data;
      }, function (error) {
        $state.go('app.default');
      });
    }

    function editEntry(content) {
      blog.editMode = false;
      api.postBlog(content).then(function (data) {
        blog.alert = {
          success: true,
          message: 'Successfully saved'
        };
        blog.entry = data;
        getEntries();

        $timeout(function () {
          blog.alert = null;
        }, 1500);
      }, function (error) {
        blog.alert = {
          success: false,
          message: 'Something Went Wrong... ' + error
        };
      });
    }

    function deleteEntry() {
      api.deleteBlog($state.params.id).then(function (data) {
        blog.alert = {
          success: true,
          message: 'Successfully deleted'
        };

        $timeout(function () {
          blog.alert = null;
          $state.go('app.default');
        }, 1500);
      }, function (error) {
        blog.alert = {
          success: false,
          message: 'Something Went Wrong... ' + error
        };
      });
    }
  }
})();
'use strict';

(function () {

  angular.module('app').directive('appPostBlog', appPostBlog);

  appPostBlog.$inject = ['$rootScope'];

  function appPostBlog($rootScope) {
    var directive = {
      scope: true,
      restrict: 'E',
      templateUrl: '/app/views/post-blog.html',
      controller: PostBlogCtrl,
      controllerAs: 'post',
      bindToController: true,
      replace: true,
      transclude: true,
      link: function link(scope, element, attrs) {
        $rootScope.$on('$stateChangeStart', function () {
          element.remove();
          element.parent().empty();
          scope.$destroy();
        });
      }
    };

    return directive;
  }

  PostBlogCtrl.$inject = ['$scope', '$state', 'api'];

  function PostBlogCtrl($scope, $state, api) {
    var post = this;

    post.newBlog = {
      title: '',
      content: ''
    };

    /**
     * @name postBlog
     * @desc post a new blog to the backend
     * @param {Object} blog data to be submitted
     * @returns {Object} response
     */

    post.postBlog = function () {
      api.postBlog(post.newBlog).then(function (data) {
        return $state.go('app.default');
      }, function (error) {
        post.alert = true;
      });
    };
  }
})();
'use strict';

(function () {
  'use strict';

  angular.module('app').directive('appHeader', HeaderDirective);

  HeaderDirective.$inject = ['$rootScope'];

  function HeaderDirective($rootScope) {
    var views = '/app/views/';
    var directive = {
      scope: true,
      restrict: 'E',
      replace: true,
      transclude: true,
      templateUrl: views + 'header.html',
      link: function link(scope, element, attrs) {
        $rootScope.$on('$stateChangeStart', function () {
          element.remove();
          element.parent().empty();
          scope.$destroy();
        });
      }
    };

    return directive;
  }
})();
/*
(function () {
  'use strict'

  angular
    .module('app')
    .directive('appFooter', appFooter)

  appFooter.$inject = [
    '$rootScope'
  ]

  function appFooter ($rootScope) {
    let views = '/app/views/'
    let directive = {
      scope: true,
      templateUrl: ''
    }

    return directive
  }

})()
*/
"use strict";
'use strict';

(function () {

  angular.module('app').directive('userLogin', UserLogin);

  UserLogin.$inject = ['$rootScope'];

  function UserLogin($rootScope) {
    var directive = {
      scope: true,
      restrict: 'E',
      replace: true,
      transclude: true,
      templateUrl: '/app/views/login.html',
      controllerAs: 'login',
      bindToController: true,
      controller: UserLoginController,
      link: function link(scope, element, attrs) {
        $rootScope.$on('$stateChangeStart', function () {
          element.remove();
          element.parent().empty();
          scope.$destroy();
        });
      }
    };

    return directive;
  }

  UserLoginController.$inject = ['$rootScope', '$state', 'api', 'context'];

  function UserLoginController($rootScope, $state, api, userContext) {
    var login = this;

    login.alert = false;
    login.initLogin = initLogin;

    /**
     * @name initialize login
     * @desc
     *  function that sets the context of the current user via
     *  app service:userContext & redirects user to dashboard.
     *  this function also performs login form validation
     * @param {Boolean} isValid  utilizes angularjs form validation
     */
    function initLogin(isValid) {
      var _this = this;

      /**
       * @name initLogin:userLogin internal fn
       * @desc calls on to backend to log the user in and sets the
       * context of the current user
       * @param {String} redirect: a name of an available route
       * @returns {Boolean}
       */
      this.userLogin = function (redirect) {
        api.login(login.user).then(function (data) {
          if (data.hasOwnProperty('token')) {
            userContext.setCurrentUser(Object.assign({
              username: login.user.username
            }, data));
            $rootScope.$emit('auth::setUser');
            return $state.go(redirect);
          }
        }, function (error) {
          return _this.userInvalid();
        });
        return true;
      };

      /**
       * @name initLogin:userInvalid
       * @desc flags the ui for invalid fields before submission
       * @param
       * @returns {Boolean}
       */
      this.userInvalid = function () {
        login.alert = true;
        return false;
      };

      return isValid ? this.userLogin('app.default') : this.userInvalid();
    }
  }
})();
'use strict';

(function () {
  'use strict';

  angular.module('app').factory('api', ApiFactory);

  ApiFactory.$inject = ['$rootScope', '$http', '$q', '$state', 'context'];

  function ApiFactory($rootScope, $http, $q, $state, userContext) {
    var baseurl = 'https://hei-workshop.herokuapp.com/api/';
    var user = userContext.getCurrentUser();
    var headers = {
      'Content-Type': 'application/json',
      'Authorization': user && user.token ? 'Bearer ' + user.token : undefined
    };

    this.login = function (credentials) {
      return execute($http.post(baseurl + 'login', credentials, { headers: headers }));
    };

    this.getBlogs = function () {
      return execute($http.get(baseurl + 'blogs', { headers: headers }));
    };

    this.postBlog = function (newBlog) {
      return execute($http.post(baseurl + 'blogs', newBlog, { headers: headers }));
    };

    this.getBlog = function (blogId) {
      return execute($http.get(baseurl + 'blogs/' + blogId, { headers: headers }));
    };

    this.deleteBlog = function (blogId) {
      return execute($http.delete(baseurl + 'blogs/' + blogId, { headers: headers }));
    };

    function execute(request) {
      return request.then(handleSuccess, handleError);
    }

    function handleSuccess(response) {
      return response.data;
    }

    function handleError(error) {
      if (error.status === 401) {
        $state.go('app.login');
        return $q.reject(error);
      } else if (error.status === -1) {
        $state.go('app.logout');
        return $q.reject(error);
      } else {
        return $q.reject(error);
      }
    }

    // notifies ApiFactory to update `user` and `Authorization` on login/logout
    $rootScope.$on('auth::setUser', function () {
      user = userContext.getCurrentUser();
      headers.Authorization = user && user.token ? 'Bearer ' + user.token : undefined;
    });

    return this;
  }
})();
'use strict';

(function () {
  'use strict';

  angular.module('app').service('context', Context);

  Context.$inject = ['$cookies'];

  function Context($cookies) {
    return {
      currentSession: null,
      setCookies: function setCookies(context) {
        for (var obj in context) {
          $cookies.put(obj, context[obj], { path: '/' });
        }
      },
      setCurrentUser: function setCurrentUser(data) {
        return data && Object.keys(data).length > 0 ? this.setCookies(data) : null;
      },
      getCurrentUser: function getCurrentUser() {
        return Object.keys($cookies.getAll()).length > 0 ? Object.assign({}, {
          username: $cookies.get('username'),
          token: $cookies.get('token')
        }) : null;
      }
    };
  }
})();