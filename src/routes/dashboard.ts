import { Router, Request, Response, NextFunction} from "express";
import * as appTypes from "../utils/common";
import { createClient } from "../utils/database/server-database";
import { createNewChat, sendPromptToApi } from "../utils/ai/ai";
import { Chat, Content, Part } from "@google/genai";



const dashRouter: Router = Router();

// ----------------------------------- FUNCTIONS ------------------------------ //

async function requireAuth(req: Request, res: Response, next: NextFunction):Promise<void> {

	const supabase = createClient({req, res});

	const {data, error} = await supabase.auth.getUser();

	if(error || !data?.user){

		res.redirect('/login');
		return;

	}else{

		req.user = data.user;
		next();

	}

}

// creates a new chat in the db
async function createAndSaveChatDB(req: Request, res: Response): Promise<void | string>{

	// get user id
	const userId: string = req.user?.id;
		
	const supabase = createClient({req, res});

	// insert into chats table
	const {data, error} = await supabase.from("Chats").insert({user_id: userId}).select("id");


	// could not create chat in database
	if(error || data[0].id){
		throw new Error("Could not create chat");
	}
	const chatId = data?.pop().id;
	return chatId;	
}

//converting from my type to parts
function convertToParts(arr: {role: string, message: string}[]): Content[]{


	const parts:Content[] = [];

	arr.forEach((el) => {

		const partArr: Part[] = [{text:el.message}];

		const obj:Content = {role: el.role, parts: partArr};

		parts.push(obj);
	});

	return parts;
} 


dashRouter.use(requireAuth);



// --------------------------------------------- ROUTE SPECIFIC FUNCTIONS ---------------------------------- //
dashRouter.get('/', (req, res) => {

    res.render('dashboard', { 
		layout: 'dashboard-base',
		chatHistory: null,
		chatId: null,		
	});

});


dashRouter.post('/', (req, res)=>{

	res.send('what the flip');


});

dashRouter.post("/chat/create", async (req: Request, res: Response, next) =>{

	const supabase = createClient({req,res});
	const userId: string = req.user?.id;

	//CREATE NEW ID
	const  {data, error} = await supabase.from("Chats").insert({"user_id": userId}).select("id");
	const chatId:string = data?.pop().id; 
	if(error || !chatId){

		console.log(error);
		next(error);
		return;

	}else {

		res.render("dashboard", {layout: "dashboard-base", chatHistory: null, chatId: chatId});

	}

})

dashRouter.post('/chat/:id', async (req, res, next) =>{

	try{

		const supabase = createClient({req, res});
		
		// getting user id for fetching the chat id
		const userId: string = req.user?.id;
		
		// get the id
		let chatId: string = req.params.id;
		let temp: null | appTypes.chatDbType[] = null;

		let history: Content[] ;


		const {data, error} = await supabase.from("Chats").select("messages").eq("id", chatId);
		const messages = data?.pop().messages;

		if(error || !messages){
			history = null;

		}else {
			temp = messages;
			history = convertToParts(temp);
		}

		// sending prompt and recieving response
		const prompt: string = req.body.prompt;
		temp.push({role: "user", message: prompt});

		const chat = await createNewChat(history);

		const response:string = await sendPromptToApi(prompt, chat);
		temp.push({role: "model", message: response});

		res.render("dashboard", {layout: "dashboard-base", chatHistory: temp, chatId: chatId});

	}catch(err){
		console.error("Error: ", err);
		next(err);
	}

	

});


// // insert new prompt into chat
// dashRouter.post("/chat/prompt", async (req, res) => {

// 	const supabase: SupabaseClient = createClient({req, res});

// 	// the prompt by the user
// 	const prompt:string | null = req.body.prompt;

// 	if (prompt){

// 		const {data, error} = await supabase.auth.getUser();

// 		if(error){

// 			res.redirect("/login");
// 			return;
			
// 		}else {


// 		const userId = data.user.id;

// 		// const response: string = await 

// 		}

// 	}

// });	

export default dashRouter;
