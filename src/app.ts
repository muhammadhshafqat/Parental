import express from 'express';
import path from 'path';
import expressLayouts from 'express-ejs-layouts';
import cors from "cors";
import http from "http";
import url from 'url';
import { wss } from './utils/websocket/socketServer';

//----------------------------------------------- EXPRESS APP SETUP ---------------------------------
const app = express();
const port = process.env.PORT || 3000;

// layout setup templating
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../public/views'));
app.use(expressLayouts);
app.use(express.static('public'));
app.set('layout', 'base');
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// --------------------------------------- SERVER SETUP ------------------------------ //
const server = http.createServer(app);

//----------------------------------------------------- ROUTING ------------------------------
app.get('/', (req, res) => {
    res.render('home', { title: 'Home' });
});

import authRoutes from './routes/auth';
app.use('/', authRoutes);

import dashRouter from './routes/dashboard';
app.use('/dashboard', dashRouter);

import callbackRouter from "./routes/callbackRedirect";
app.use('/callbackRedirect', callbackRouter);

import academicsRouter from './routes/academics';
app.use('/dashboard/academics', academicsRouter);

// --------------------------------- ACTIVATING WEB SOCKET SERVER --------------------------//
server.on("upgrade", (request, socket, head) => {
    console.log('WebSocket upgrade request received');
    console.log('URL:', request.url);
    console.log('Host:', request.headers.host);
    
    // IMPORTANT: Accept WebSocket connections at root path for Railway
    // Railway doesn't handle path-based WebSocket routing well
    wss.handleUpgrade(request, socket, head, (ws) => {
        console.log('WebSocket upgrade successful');
        wss.emit("connection", ws, request);
    });
});

// ------------------------------------------------------- APP STARTUP ----------------------
// CRITICAL FOR RAILWAY: Listen on 0.0.0.0, not localhost
server.listen(port, () => {
    console.log(`Server: http://localhost:${port}`);
    console.log(`WebSocket server ready`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default server;