import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from "react-router-dom";
import UserProfile from "./components/UserProfile";
import ProtectRoute from "./components/ProtectRoute";
import { MainContainer, CreateContainer } from "./components";
import Errorpage from "./components/Errorpage";
import store from "./redux";
import { Provider } from "react-redux";
import toast, { Toaster } from 'react-hot-toast';
import Menu from "./components/Menu";
import MenuPage from "./page/MenuPage";
import Cart from "./page/Cart";
import MenuStatic from "./page/MenuStatic";
import About from "./page/About";
import Service from "./page/Service";
import Success from "./page/Success";
import Canceled from "./page/Canceled";
import Upload from "./page/Upload";

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<App />} errorElement={<Errorpage />}>
      <Route
        path="/"
        element={<MainContainer />}
        errorElement={<Errorpage />}
      />
      <Route path="/about" element={<About/>}  />
      <Route path="/service" element={<Service/>}  />
      <Route path="/cart" element={<Cart />} />
      <Route path="/createitem" element={<CreateContainer />}  />
      <Route path="/Success" element={<Success />}  />
      <Route path="/Canceled" element={<Canceled />}  />
        <Route
        path="/upload"
        element={
          <ProtectRoute>
            <Upload />
          </ProtectRoute>
        }
      />
          <Route
        path="/profile"
        element={
          <ProtectRoute>
            <UserProfile />
          </ProtectRoute>
        }
      />
    </Route>
  )
);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <Provider store={store}>
    <RouterProvider router={router}>
      <App />
    </RouterProvider>
  </Provider>
);
