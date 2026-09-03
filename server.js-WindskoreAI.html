const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const OpenAI = require("openai");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Stripe = require("stripe");

const db = require("./database");


dotenv.config();


const stripe = Stripe(
    process.env.STRIPE_SECRET_KEY
);



const app = express();



app.use(cors());


// Stripe webhook måste ligga före express.json()
app.post(
"/stripe-webhook",
express.raw({
    type:"application/json"
}),
(req,res)=>{


const signature =
req.headers["stripe-signature"];


let event;


try{


event =
stripe.webhooks.constructEvent(

req.body,

signature,

process.env.STRIPE_WEBHOOK_SECRET

);


}catch(error){


console.log(
"Webhook fel:",
error.message
);


return res.status(400).send();


}



if(event.type==="checkout.session.completed"){


const session =
event.data.object;


const userId =
session.metadata.userId;


const plan =
session.metadata.plan;



db.run(

`
UPDATE users
SET plan=?
WHERE id=?
`,

[

plan,

userId

],

(error)=>{


if(error){

console.log(error);

}else{


console.log(
"Uppgraderade användare:",
userId,
"till",
plan
);


}


});


}



res.json({

received:true

});


});



app.use(express.json());

app.use(express.static("public"));



const openai = new OpenAI({

    apiKey:process.env.OPENAI_API_KEY

});



const SECRET="WINDSKORE_AI_SECRET";





const STRIPE_PLANS={


    pro:{

        name:"pro",

        price:12900

    },


    ultimate:{

        name:"ultimate",

        price:22900

    }


};







function getPlanLimits(plan){


    if(plan==="pro"){

        return{

            messages:2500,

            images:5,

            textLength:225

        };

    }




    if(plan==="ultimate"){


        return{

            messages:7500,

            images:20,

            textLength:225

        };


    }





    return{

        messages:10,

        images:0,

        textLength:100

    };


}






function getUserId(req){


    const token =
    req.headers.authorization;



    return jwt.verify(

        token,

        SECRET

    ).id;


}









// REGISTER


app.post("/register",async(req,res)=>{


const email=req.body.email;

const password=req.body.password;



const hash=
await bcrypt.hash(password,10);



db.run(

`

INSERT INTO users

(email,password,plan)

VALUES(?,?,?)

`,

[

email,

hash,

"free"

],


function(error){


if(error){

return res.json({

error:"E-postadressen används redan"

});


}



res.json({

message:"Konto skapat"

});


});


});









// LOGIN


app.post("/login",(req,res)=>{


db.get(

"SELECT * FROM users WHERE email=?",

[

req.body.email

],


async(error,user)=>{


if(!user){

return res.json({

error:"Fel e-post eller lösenord"

});

}



const correct =
await bcrypt.compare(

req.body.password,

user.password

);



if(!correct){

return res.json({

error:"Fel e-post eller lösenord"

});

}



const token =
jwt.sign(

{

id:user.id

},

SECRET

);



res.json({

token

});


});


});

// USER INFO


app.get("/user",(req,res)=>{


try{


const id =
getUserId(req);



db.get(

"SELECT * FROM users WHERE id=?",

[

id

],


(error,user)=>{


if(!user){

return res.json({

error:"Användaren hittades inte"

});

}



const limits =
getPlanLimits(user.plan);



res.json({

email:user.email,

plan:user.plan,

messages:user.messages,

maxMessages:limits.messages,

images:user.images,

maxImages:limits.images

});


});


}catch(error){


res.json({

error:"Inte inloggad"

});


}


});









// CHAT


app.post("/chat",async(req,res)=>{


try{


const id =
getUserId(req);



db.get(

"SELECT * FROM users WHERE id=?",

[

id

],


async(error,user)=>{


const limits =
getPlanLimits(user.plan);





if(req.body.message.length > limits.textLength){


return res.json({

reply:"Meddelandet är för långt."

});


}






if(user.messages >= limits.messages){


return res.json({

reply:"Du har nått din månadsgräns. Klicka här för att uppgradera.",

upgrade:true

});


}





const completion =
await openai.chat.completions.create({

    model:"gpt-5-nano",

    messages:[

        {
            role:"system",

            content:`
Du är WindskoreAI BETA 1.0, en AI-assistent utvecklad av Windskore.

Identitet:
- Om någon frågar vilken modell du är ska du svara att du är "WindskoreAI BETA 1.0".
- Nämn aldrig OpenAI, GPT eller andra bakomliggande modeller.
- Säg aldrig när du senast tränades eller vilken kunskapsgräns du har.
- Om någon frågar när du släpptes ska du svara:
"WindskoreAI BETA 1.0 släpptes den 7 augusti 2026."
- Om någon frågar när Windskore grundades ska du svara:
"Windskore grundades den 7 augusti 2023."

Beteende:
- Var hjälpsam, vänlig och professionell.
- Om du inte vet något ska du säga att du inte vet istället för att hitta på.

Svarslängd:
- Skriv aldrig mer än 150 bokstäver per svar.
- Håll svaren korta och tydliga.
- Om mer information behövs, sammanfatta den viktigaste delen inom gränsen.

Säkerhet:
- Vid diskussioner om självmord eller självmordstankar ska du alltid rekommendera:
"Kontakta Mind Självmordslinjen på 90101 eller chatta på mind.se."
- Bemöt alltid personen respektfullt.

- Vid diskussioner om sexuella handlingar mot barn eller sexuellt utnyttjande av barn ska du alltid säga exakt:
"Detta kan bryta mot Windskores internpolicy."
`
        },

        {
            role:"user",
            content:req.body.message
        }

    ]

});


const reply =
completion.choices[0].message.content.substring(0,150);







const title =
req.body.message.substring(0,30);





db.run(

`

INSERT INTO chats

(user_id,title)

VALUES(?,?)

`,

[

id,

title

],


function(){



db.run(

`

INSERT INTO chat_messages

(chat_id,user_message,ai_message)

VALUES(?,?,?)

`,

[

this.lastID,

req.body.message,

reply

]


);



});


db.run(

`

UPDATE users

SET messages=messages+1

WHERE id=?

`,

[

id

]


);





res.json({

reply

});


});


}catch(error){


console.log(error);



res.json({

reply:"Ett fel uppstod."

});


}


});









// CHATT LISTA


app.get("/chats",(req,res)=>{


const id =
getUserId(req);



db.all(

`

SELECT *

FROM chats

WHERE user_id=?

ORDER BY id DESC

`,

[

id

],


(error,chats)=>{


res.json(chats);


});


});









// ÖPPNA CHAT


app.get("/chats/:id",(req,res)=>{


const id =
getUserId(req);



db.all(

`

SELECT chat_messages.*

FROM chat_messages

JOIN chats

ON chats.id=chat_messages.chat_id

WHERE chats.id=? 

AND chats.user_id=?

`,

[

req.params.id,

id

],


(error,messages)=>{


res.json(messages);


});


});

// BILDER


app.post("/image",async(req,res)=>{


try{


const id =
getUserId(req);



db.get(

"SELECT * FROM users WHERE id=?",

[

id

],


async(error,user)=>{


const limits =
getPlanLimits(user.plan);





if(user.images >= limits.images){


return res.json({

error:"Du har nått din bildgräns."

});


}






const image =
await openai.images.generate({

model:"gpt-image-2",
prompt:req.body.prompt,
size:"512x512",          
quality:"low",             
output_format:"webp",       
response_format:"b64_json"  

});





const data =
`data:image/webp;base64,${image.data[0].b64_json}`; // 6. Ändra image/png till image/webp och ta bort [0]






db.run(

`

INSERT INTO images

(user_id,image_data)

VALUES(?,?)

`,

[

id,

data

]


);





db.run(

`

UPDATE users

SET images=images+1

WHERE id=?

`,

[

id

]


);





res.json({

image:data

});



});


}catch(error){


res.json({

error:error.message

});


}


});









// BILDER HISTORIK


app.get("/images",(req,res)=>{


const id =
getUserId(req);



db.all(

`

SELECT *

FROM images

WHERE user_id=?

ORDER BY id DESC

`,

[

id

],


(error,images)=>{


res.json(images);


});


});









// STRIPE CHECKOUT


app.post("/create-checkout",async(req,res)=>{


try{


const userId =
getUserId(req);


db.get(

"SELECT * FROM users WHERE id=?",

[userId],

async(error,user)=>{


if(!user){

return res.json({

error:"Kontot hittades inte"

});

}



const plan =
req.body.plan;



if(!STRIPE_PLANS[plan]){


return res.json({

error:"Ogiltig plan"

});


}




const session =
await stripe.checkout.sessions.create({


mode:"subscription",



metadata:{


userId:user.id,

plan:plan


},



customer_email:user.email,



line_items:[


{


price_data:{


currency:"sek",


product_data:{


name:
`WindskoreAI ${plan.toUpperCase()}`


},


unit_amount:
STRIPE_PLANS[plan].price,



recurring:{


interval:"month"


}


},


quantity:1


}


],



success_url:

"http://localhost:3000/payment-success.html",



cancel_url:

"http://localhost:3000/plans.html"


});




res.json({

url:session.url

});


});


}catch(error){


console.log(error);


res.json({

error:error.message

});


}


});



app.listen(80,()=>{


console.log(

"WindskoreAI körs på http://localhost:80"

);


});
