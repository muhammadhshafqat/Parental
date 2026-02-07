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
app.use('/', authRoutes)

import dashRouter from './routes/dashboard';
app.use('/dashboard', dashRouter);

import callbackRouter from "./routes/callbackRedirect";
app.use('/callbackRedirect', callbackRouter);

// --------------------------------- ACTIVATING WEB SOCKET SERVER --------------------------//

server.on("upgrade", (request, socket, head) => {

	const {pathname} = new URL(request.url, `http://${request.headers.host}`);

	if(pathname === '/dashboard/chat'){

		wss.handleUpgrade(request, socket, head, (ws) =>{

			wss.emit("connection", ws, request);

		});

	}else{
		socket.destroy();
	}

});
// ------------------------------------------------------- APP STARTUP   ----------------------
server.listen(port, () => {
	return console.log(`Server: http://localhost:${port}`);
});
