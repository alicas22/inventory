const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});

const prompt=`Analyze the attached image. Give the main item in the image a name labeled 'itemName' and categorize it for an inventory management system and label it 'category'.
                        Return the results in a structured JSON format with plain text, no markdown, and no extra characters. Below is an example of the formatted JSON result:
                        {
                            "results": {
                              "itemName": "Book",
                              "category": "Office",
                            }
                        }`

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method === "POST") {
    const { image } = req.body;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `${image}`,
                },
              },
            ],
          },
        ],
        max_tokens: 300,
      });

      console.log("response:", response);
      const content = JSON.parse(response.choices[0].message.content);

      return res.json(content);
    } catch (error) {
      console.log("image:", image);
      console.error("Error analyzing image:", error);
      res
        .status(500)
        .json({ message: "Error analyzing image", error: error.message });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}

//       console.log('content:', content);
//       return res.json(content);
//     } catch (error) {
//       console.log('image:', image);
//       console.error('Error analyzing image:', error);
//       res.status(500).json({ message: 'Error analyzing image' });
//     }
//   } else {
//     res.status(405).json({ message: 'Method not allowed' });
//   }
// }

// Attempt to parse content as JSON

// import { NextResponse } from 'next/server';
// import OpenAI from 'openai';
// import * as dotenv from 'dotenv';
// dotenv.config();

// const openai = new OpenAI({
//   apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
// });

// export async function POST(request) {
//   try {
//     const body = await request.text();
//     const { image } = JSON.parse(body);

//     if (!image) {
//       return NextResponse.json({ error: 'Image is required' }, { status: 400 });
//     }

//     const response = await openai.chat.completions.create({
//       model: "gpt-4o",
//       messages: [
//         {
//           role: "user",
//           content: [
//             { type: "text", text: "Label the most prominent item in the image and provide its category." },
//             { type: "image_url", image_url: {url:`data:image/png;base64,${image}`} }
//           ]
//         }
//       ]
//     });

//     console.log('OpenAI response:', response);

//     const result = response.choices[0].message.content.split(';');
//     const label = result[0].split(':')[1].trim();
//     const category = result[1].split(':')[1].trim();

//     return NextResponse.json({ label, category });
//   } catch (error) {
//     console.error('Error processing image:', error);
//     return NextResponse.json({ error: 'Failed to get label and category' }, { status: 500 });
//   }
// }
