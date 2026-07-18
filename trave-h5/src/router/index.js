import { createRouter, createWebHashHistory } from "vue-router";

const routes = [
  {
    path: "/",
    name: "Home",
    component: () => import("../views/Home.vue"),
    meta: { requiresAuth: false, allowGuest: true },
  },
  {
    path: "/chat",
    name: "Chat",
    component: () => import("../views/Chat.vue"),
    meta: { requiresAuth: false, allowGuest: true },
  },
  {
    path: "/profile",
    name: "Profile",
    component: () => import("../views/Profile.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/edit-profile",
    name: "EditProfile",
    component: () => import("../views/EditProfile.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/favorites",
    name: "Favorites",
    component: () => import("../views/Favorites.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/history",
    name: "History",
    component: () => import("../views/History.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/settings",
    name: "Settings",
    component: () => import("../views/Settings.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/change-password",
    name: "ChangePassword",
    component: () => import("../views/ChangePassword.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/detail",
    name: "Detail",
    component: () => import("../views/Detail.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/login",
    name: "Login",
    component: () => import("../views/Login.vue"),
    meta: { isPublic: true },
  },
  {
    path: "/register",
    name: "Register",
    component: () => import("../views/Register.vue"),
    meta: { isPublic: true },
  },
  {
    path: "/forgot",
    name: "Forgot",
    component: () => import("../views/ForgotPassword.vue"),
    meta: { isPublic: true },
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const accessToken = localStorage.getItem("accessToken");
  const isPublic = to.meta.isPublic;
  const requiresAuth = to.meta.requiresAuth;
  const allowGuest = to.meta.allowGuest;

  if (isPublic) {
    next();
    return;
  }

  if (!requiresAuth || allowGuest) {
    next();
    return;
  }

  if (accessToken) {
    next();
  } else {
    localStorage.setItem("loginRedirect", to.fullPath);
    next({ path: "/login", query: { redirect: to.fullPath } });
  }
});

export default router;
