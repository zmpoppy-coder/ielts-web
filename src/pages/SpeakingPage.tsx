import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Mic, MicOff, Loader2, Play, RefreshCw,
  ChevronRight, AlertCircle, Timer, RotateCcw,
  ChevronLeft, Crown, ShoppingCart, LogOut, Pause
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import * as pdfjsLib from "pdfjs-dist";
import { supabase } from "@/integrations/supabase/client";

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

// ── 2025-2026 雅思口语中国区真题题库 ──
type QuestionItem = { title: string; content: string; category: string };

const MOCK_PART1: QuestionItem[] = [
  { title: "Work or Study", content: "Q1. Do you work or are you a student?\nQ2. What do you like about your job/studies?\nQ3. Is there anything you dislike about it?\nQ4. What job would you like to do in the future?", category: "Part 1" },
  { title: "Hometown", content: "Q1. Where is your hometown?\nQ2. What do you like most about your hometown?\nQ3. Has your hometown changed much in recent years?\nQ4. Would you recommend people to visit your hometown?", category: "Part 1" },
  { title: "Accommodation", content: "Q1. Do you live in a house or a flat?\nQ2. What is your favourite room in your home?\nQ3. Would you like to move to a different place?\nQ4. What kind of place would you like to live in the future?", category: "Part 1" },
  { title: "Weather", content: "Q1. What's the weather like in your city?\nQ2. Do you prefer hot or cold weather?\nQ3. Does the weather affect your mood?\nQ4. What do you usually do on rainy days?", category: "Part 1" },
  { title: "Reading", content: "Q1. Do you like reading?\nQ2. What kind of books do you enjoy?\nQ3. Do you prefer e-books or paper books?\nQ4. Did you read a lot when you were a child?", category: "Part 1" },
  { title: "Sports", content: "Q1. Do you like playing sports?\nQ2. What sports are popular in your country?\nQ3. Do you think it's important for children to play sports?\nQ4. Have you ever watched a live sports event?", category: "Part 1" },
  { title: "Social Media", content: "Q1. Do you use social media?\nQ2. Which social media platform do you use most?\nQ3. Do you think people spend too much time on social media?\nQ4. Has social media changed the way you communicate?", category: "Part 1" },
  { title: "Cooking", content: "Q1. Do you like cooking?\nQ2. What was the last meal you cooked?\nQ3. Do you think it's important to know how to cook?\nQ4. Would you like to learn to cook more dishes?", category: "Part 1" },
  { title: "Music", content: "Q1. What type of music do you like?\nQ2. Do you play any musical instruments?\nQ3. Has your taste in music changed over the years?\nQ4. Do you prefer listening to music alone or with others?", category: "Part 1" },
  { title: "Public Transport", content: "Q1. Do you often use public transport?\nQ2. What's the most common form of transport in your city?\nQ3. Do you think public transport needs improvement in your area?\nQ4. Do you prefer public transport or driving?", category: "Part 1" },
  { title: "Shopping", content: "Q1. Do you enjoy shopping?\nQ2. Do you prefer shopping online or in stores?\nQ3. What was the last thing you bought?\nQ4. Do you think people buy too many things they don't need?", category: "Part 1" },
  { title: "Friends", content: "Q1. Do you have many friends?\nQ2. How often do you meet your friends?\nQ3. Do you prefer having a few close friends or many acquaintances?\nQ4. Have you made any new friends recently?", category: "Part 1" },
  { title: "Trees & Plants", content: "Q1. Do you like plants?\nQ2. Have you ever planted a tree?\nQ3. Do you think cities need more trees?\nQ4. What's the most common tree in your area?", category: "Part 1" },
  { title: "Happiness", content: "Q1. What makes you happy?\nQ2. Do you think money can buy happiness?\nQ3. Are you happier now than you were as a child?\nQ4. What do you do when you feel unhappy?", category: "Part 1" },
  { title: "Patience", content: "Q1. Are you a patient person?\nQ2. What things make you impatient?\nQ3. Do you think patience is important?\nQ4. Have you become more patient as you've grown older?", category: "Part 1" },
  { title: "Gifts", content: "Q1. Do you like giving gifts?\nQ2. What kind of gifts do you usually give?\nQ3. What was the best gift you ever received?\nQ4. Do you think expensive gifts are better?", category: "Part 1" },
  { title: "Morning Routine", content: "Q1. What do you usually do in the morning?\nQ2. Do you prefer mornings or evenings?\nQ3. Has your morning routine changed recently?\nQ4. What would be your ideal morning?", category: "Part 1" },
  { title: "Colours", content: "Q1. What's your favourite colour?\nQ2. Do you usually wear clothes in bright colours?\nQ3. Do colours affect your mood?\nQ4. Were your colour preferences different when you were younger?", category: "Part 1" },
  { title: "Photography", content: "Q1. Do you like taking photos?\nQ2. Do you prefer taking photos with a phone or a camera?\nQ3. What do you usually take photos of?\nQ4. Do you print your photos or keep them on your phone?", category: "Part 1" },
  { title: "Noise", content: "Q1. Do you like to be in a quiet or noisy environment?\nQ2. What kinds of noise bother you the most?\nQ3. Is your neighbourhood noisy?\nQ4. Do you think noise pollution is a problem in cities?", category: "Part 1" },
  { title: "Movies & Films", content: "Q1. Do you enjoy watching movies?\nQ2. What kind of movies do you like best?\nQ3. Do you prefer watching movies at home or in the cinema?\nQ4. Who is your favourite actor or actress?", category: "Part 1" },
  { title: "Animals & Pets", content: "Q1. Do you like animals?\nQ2. Have you ever had a pet?\nQ3. What is the most popular pet in your country?\nQ4. Do you think animals should be kept in zoos?", category: "Part 1" },
  { title: "Holidays & Vacations", content: "Q1. How do you usually spend your holidays?\nQ2. Do you prefer to travel or stay at home during holidays?\nQ3. What was the best holiday you've ever had?\nQ4. Do you think people need more holidays?", category: "Part 1" },
  { title: "Sleep", content: "Q1. How many hours do you usually sleep?\nQ2. Do you take naps during the day?\nQ3. What do you do if you can't fall asleep?\nQ4. Has your sleep pattern changed compared to when you were younger?", category: "Part 1" },
  { title: "Art", content: "Q1. Are you interested in art?\nQ2. Did you learn to draw when you were a child?\nQ3. Do you think art is important in people's lives?\nQ4. Have you ever visited an art gallery?", category: "Part 1" },
  { title: "Clothes & Fashion", content: "Q1. What kind of clothes do you like to wear?\nQ2. Do you follow fashion trends?\nQ3. Has your style changed over the years?\nQ4. Do you think people are judged by what they wear?", category: "Part 1" },
  { title: "Phones & Apps", content: "Q1. How often do you use your phone?\nQ2. What apps do you use the most?\nQ3. Do you think people are too dependent on their phones?\nQ4. At what age should children be allowed to have a phone?", category: "Part 1" },
  { title: "Handwriting", content: "Q1. Do you often write things by hand?\nQ2. Do you think handwriting is still important?\nQ3. Is your handwriting neat or messy?\nQ4. Do children in your country learn handwriting at school?", category: "Part 1" },
  { title: "Helping Others", content: "Q1. Do you often help others?\nQ2. How do you feel when someone helps you?\nQ3. Do you think people help each other less than before?\nQ4. What is the best way to help someone in need?", category: "Part 1" },
  { title: "Boring Things", content: "Q1. What do you do when you feel bored?\nQ2. Do you think boring activities are sometimes necessary?\nQ3. What was the most boring thing you've had to do?\nQ4. Do you get bored easily?", category: "Part 1" },
  { title: "Maps & Directions", content: "Q1. Are you good at reading maps?\nQ2. Do you prefer using a paper map or a digital one?\nQ3. How often do you ask for directions?\nQ4. Have you ever got lost somewhere?", category: "Part 1" },
  { title: "Teamwork", content: "Q1. Do you prefer working alone or in a team?\nQ2. What makes a good team member?\nQ3. Have you ever had a problem working with others?\nQ4. Do you think teamwork is taught well in schools?", category: "Part 1" },
  { title: "Museums", content: "Q1. Do you like visiting museums?\nQ2. What kind of museum do you enjoy most?\nQ3. Did you go to museums when you were a child?\nQ4. Do you think museums should be free?", category: "Part 1" },
  { title: "Fish & Seafood", content: "Q1. Do you like eating fish?\nQ2. Have you ever been fishing?\nQ3. Is seafood popular in your area?\nQ4. Do you think eating fish is healthy?", category: "Part 1" },
  { title: "Science", content: "Q1. Were you interested in science as a child?\nQ2. What area of science interests you most?\nQ3. Do you think science is important in everyday life?\nQ4. Would you like to work in a science-related field?", category: "Part 1" },
  { title: "Chocolate", content: "Q1. Do you like chocolate?\nQ2. How often do you eat it?\nQ3. Have you ever given chocolate as a gift?\nQ4. Do you prefer dark chocolate or milk chocolate?", category: "Part 1" },
  { title: "Wild Animals", content: "Q1. Do you like watching wildlife documentaries?\nQ2. Have you ever seen a wild animal up close?\nQ3. Are there any wild animals in your area?\nQ4. Do you think enough is done to protect wild animals?", category: "Part 3" },
  { title: "Numbers & Maths", content: "Q1. Are you good with numbers?\nQ2. Do you have a lucky number?\nQ3. How do you use maths in your daily life?\nQ4. Did you enjoy maths at school?", category: "Part 1" },
  { title: "Staying Up Late", content: "Q1. Do you often stay up late?\nQ2. What do you usually do when you stay up late?\nQ3. How do you feel the next day after staying up?\nQ4. Do you think staying up late is bad for health?", category: "Part 1" },
  { title: "Collecting Things", content: "Q1. Do you collect anything?\nQ2. What did you collect when you were a child?\nQ3. Why do people like collecting things?\nQ4. Would you like to start a new collection?", category: "Part 1" },
  { title: "Mirrors", content: "Q1. Do you look at yourself in the mirror often?\nQ2. Do you think mirrors are important in home decoration?\nQ3. Have you ever bought a mirror?\nQ4. Where do you usually have mirrors in your home?", category: "Part 1" },
  { title: "Snacks", content: "Q1. Do you like eating snacks?\nQ2. What snacks are popular in your country?\nQ3. Do you think snacking is unhealthy?\nQ4. When do you usually have snacks?", category: "Part 1" },
  { title: "Language Learning", content: "Q1. What languages can you speak?\nQ2. Do you think it's important to learn other languages?\nQ3. What's the hardest part of learning a new language?\nQ4. Would you like to learn another language in the future?", category: "Part 1" },
  { title: "Weekends", content: "Q1. What do you usually do on weekends?\nQ2. Do you prefer spending weekends at home or going out?\nQ3. Did you do anything special last weekend?\nQ4. Do you think weekends should be longer?", category: "Part 1" },
  { title: "Keys", content: "Q1. Do you always carry your keys with you?\nQ2. Have you ever lost your keys?\nQ3. Do you think keys will be replaced by technology?\nQ4. How many keys do you have?", category: "Part 1" },
  { title: "Perfume", content: "Q1. Do you wear perfume?\nQ2. Do you like to receive perfume as a gift?\nQ3. What kind of scents do you prefer?\nQ4. Do you think people use too much perfume sometimes?", category: "Part 1" },
  { title: "Picnics", content: "Q1. Do you enjoy having picnics?\nQ2. Where do people usually have picnics in your area?\nQ3. What food do you like to bring on a picnic?\nQ4. When was the last time you went on a picnic?", category: "Part 1" },
  { title: "Robots", content: "Q1. Are you interested in robots?\nQ2. Do you think robots will be common in homes in the future?\nQ3. Would you like to have a robot at home?\nQ4. Are there any jobs you think robots shouldn't do?", category: "Part 1" },
  { title: "Sunny Days", content: "Q1. Do you like sunny days?\nQ2. What do you usually do on sunny days?\nQ3. Do you prefer sunny or cloudy weather?\nQ4. Does sunshine affect your mood?", category: "Part 1" },
  { title: "Cakes & Desserts", content: "Q1. Do you like eating cakes?\nQ2. Can you bake a cake?\nQ3. On what occasions do people eat cakes in your country?\nQ4. What is your favourite type of dessert?", category: "Part 1" }
];

const MOCK_PART2: QuestionItem[] = [
  { title: "Describe a person who has inspired you", content: "You should say:\n- who this person is\n- how you know this person\n- what they did that inspired you\nand explain why this person inspired you.", category: "Part 2" },
  { title: "Describe a place you visited that impressed you", content: "You should say:\n- where this place is\n- when you visited it\n- what you did there\nand explain why it impressed you.", category: "Part 2" },
  { title: "Describe a time when you helped someone", content: "You should say:\n- who you helped\n- how you helped them\n- why you helped them\nand explain how you felt after helping them.", category: "Part 2" },
  { title: "Describe a skill you would like to learn", content: "You should say:\n- what the skill is\n- why you want to learn it\n- how you would learn it\nand explain how this skill would benefit you.", category: "Part 2" },
  { title: "Describe a memorable trip you took", content: "You should say:\n- where you went\n- who you went with\n- what you did during the trip\nand explain why this trip was memorable.", category: "Part 2" },
  { title: "Describe an interesting conversation you had recently", content: "You should say:\n- who you talked with\n- where you had the conversation\n- what the conversation was about\nand explain why it was interesting.", category: "Part 2" },
  { title: "Describe a piece of technology you find useful", content: "You should say:\n- what the technology is\n- how often you use it\n- what you use it for\nand explain why you find it useful.", category: "Part 2" },
  { title: "Describe a challenge you faced and overcame", content: "You should say:\n- what the challenge was\n- when it happened\n- how you dealt with it\nand explain how you felt after overcoming it.", category: "Part 2" },
  { title: "Describe a traditional festival in your country", content: "You should say:\n- what the festival is\n- when it takes place\n- what people do during the festival\nand explain why this festival is important.", category: "Part 2" },
  { title: "Describe a book that had a big impact on you", content: "You should say:\n- what the book was\n- when you read it\n- what it was about\nand explain how it impacted you.", category: "Part 2" },
  { title: "Describe a time you made a decision that you were happy about", content: "You should say:\n- what the decision was\n- when you made it\n- what happened as a result\nand explain why you were happy about this decision.", category: "Part 2" },
  { title: "Describe an outdoor activity you enjoy", content: "You should say:\n- what the activity is\n- where you usually do it\n- who you do it with\nand explain why you enjoy it.", category: "Part 2" },
  { title: "Describe a person you enjoy spending time with", content: "You should say:\n- who this person is\n- how you know them\n- what you usually do together\nand explain why you enjoy spending time with them.", category: "Part 2" },
  { title: "Describe a city you would like to visit in the future", content: "You should say:\n- which city it is\n- where it is located\n- what you know about this city\nand explain why you would like to visit it.", category: "Part 2" },
  { title: "Describe an achievement you are proud of", content: "You should say:\n- what the achievement was\n- when it happened\n- how you achieved it\nand explain why you are proud of it.", category: "Part 2" },
  { title: "Describe a time you tried a new type of food", content: "You should say:\n- what the food was\n- where you tried it\n- who you were with\nand explain how you felt about it.", category: "Part 2" },
  { title: "Describe a movie that made you think", content: "You should say:\n- what the movie was\n- when you watched it\n- what it was about\nand explain why it made you think.", category: "Part 2" },
  { title: "Describe a historical building you have visited", content: "You should say:\n- where it is\n- what it looks like\n- what you learned about it\nand explain why you found it interesting.", category: "Part 2" },
  { title: "Describe a time you had to wait for something", content: "You should say:\n- what you were waiting for\n- how long you waited\n- what you did while waiting\nand explain how you felt about waiting.", category: "Part 2" },
  { title: "Describe an item of clothing that is special to you", content: "You should say:\n- what it is\n- when you got it\n- how often you wear it\nand explain why it is special to you.", category: "Part 2" },
  { title: "Describe a subject you enjoyed studying at school", content: "You should say:\n- what the subject was\n- who taught it\n- what you learned\nand explain why you enjoyed it.", category: "Part 2" },
  { title: "Describe a time when you received good news", content: "You should say:\n- what the news was\n- when you received it\n- who told you\nand explain why it was good news.", category: "Part 2" },
  { title: "Describe a piece of advice someone gave you", content: "You should say:\n- who gave you the advice\n- what the advice was\n- when they gave it to you\nand explain how useful the advice was.", category: "Part 2" },
  { title: "Describe a time you visited a friend or family member", content: "You should say:\n- who you visited\n- where they live\n- what you did during the visit\nand explain why you enjoyed the visit.", category: "Part 2" },
  { title: "Describe a sport or exercise you do to stay healthy", content: "You should say:\n- what it is\n- how often you do it\n- where you do it\nand explain how it helps you stay healthy.", category: "Part 2" },
  { title: "Describe a time you forgot something important", content: "You should say:\n- what you forgot\n- when it happened\n- why you forgot it\nand explain what happened as a result.", category: "Part 2" },
  { title: "Describe a website you use often", content: "You should say:\n- what the website is\n- what you use it for\n- how often you visit it\nand explain why you find it useful.", category: "Part 2" },
  { title: "Describe a creative person you admire", content: "You should say:\n- who this person is\n- what they create\n- how you know about them\nand explain why you admire their creativity.", category: "Part 2" },
  { title: "Describe a law in your country that you think is good", content: "You should say:\n- what the law is\n- how you know about it\n- who it affects\nand explain why you think it is a good law.", category: "Part 2" },
  { title: "Describe a time when you were disappointed", content: "You should say:\n- what happened\n- when it happened\n- why you were disappointed\nand explain what you did after that.", category: "Part 2" },
  { title: "Describe a neighbour you know well", content: "You should say:\n- who this person is\n- how long you have known them\n- what you do together\nand explain why you get along with them.", category: "Part 2" },
  { title: "Describe a photo you took that you are proud of", content: "You should say:\n- what is in the photo\n- when and where you took it\n- why you took it\nand explain why you are proud of it.", category: "Part 2" },
  { title: "Describe a time you taught someone something", content: "You should say:\n- who you taught\n- what you taught them\n- how you taught them\nand explain how you felt about it.", category: "Part 2" },
  { title: "Describe a change you made in your life that was positive", content: "You should say:\n- what the change was\n- when it happened\n- why you made the change\nand explain how it improved your life.", category: "Part 2" },
  { title: "Describe a place in your city where people go to relax", content: "You should say:\n- where it is\n- what it looks like\n- who goes there\nand explain why people find it relaxing.", category: "Part 2" },
  { title: "Describe a time you were surprised by something", content: "You should say:\n- what surprised you\n- when it happened\n- who was with you\nand explain how you reacted.", category: "Part 2" },
  { title: "Describe a toy you liked in your childhood", content: "You should say:\n- what the toy was\n- who gave it to you\n- how you played with it\nand explain why you liked it.", category: "Part 2" },
  { title: "Describe a time you stayed up very late", content: "You should say:\n- when it was\n- what you were doing\n- who you were with\nand explain why you stayed up late.", category: "Part 2" },
  { title: "Describe a water sport you would like to try", content: "You should say:\n- what the sport is\n- where you would do it\n- what equipment is needed\nand explain why you want to try it.", category: "Part 2" },
  { title: "Describe a person who is good at their job", content: "You should say:\n- who this person is\n- what their job is\n- how you know them\nand explain why you think they are good at their job.", category: "Part 2" },
  { title: "Describe a tradition in your family", content: "You should say:\n- what the tradition is\n- when you do it\n- who is involved\nand explain why this tradition is important to your family.", category: "Part 2" },
  { title: "Describe a time you had to learn something quickly", content: "You should say:\n- what you had to learn\n- why you had to learn it quickly\n- how you managed to learn it\nand explain how you felt about the experience.", category: "Part 2" },
  { title: "Describe a local market you have been to", content: "You should say:\n- where the market is\n- what is sold there\n- how often you go there\nand explain what you like about it.", category: "Part 2" },
  { title: "Describe an environmental problem in your area", content: "You should say:\n- what the problem is\n- what causes it\n- how it affects people\nand explain what could be done to solve it.", category: "Part 2" },
  { title: "Describe a time you gave your opinion and people agreed", content: "You should say:\n- what the situation was\n- what your opinion was\n- who you were talking to\nand explain why people agreed with you.", category: "Part 2" },
  { title: "Describe a time you saw an interesting animal", content: "You should say:\n- what animal it was\n- where you saw it\n- what it was doing\nand explain why you found it interesting.", category: "Part 2" },
  { title: "Describe a song that has special meaning to you", content: "You should say:\n- what the song is\n- when you first heard it\n- what the song is about\nand explain why it has special meaning to you.", category: "Part 2" },
  { title: "Describe a time you had to make a difficult choice", content: "You should say:\n- what the choice was\n- when you had to make it\n- what options you had\nand explain why it was difficult.", category: "Part 2" },
  { title: "Describe a public park or garden you enjoy visiting", content: "You should say:\n- where it is\n- what it looks like\n- what you do there\nand explain why you enjoy visiting it.", category: "Part 2" },
  { title: "Describe a teacher who influenced you", content: "You should say:\n- who the teacher was\n- what subject they taught\n- how they taught\nand explain how they influenced you.", category: "Part 2" },
  { title: "Describe an interesting old person you have met", content: "You should say:\n- who this person is\n- how you met them\n- what you talked about\nand explain why you found them interesting.", category: "Part 2" },
  { title: "Describe a time you visited a museum or gallery", content: "You should say:\n- which museum or gallery it was\n- when you went there\n- what you saw\nand explain what you enjoyed most about the visit.", category: "Part 2" },
  { title: "Describe a useful app on your phone", content: "You should say:\n- what the app is\n- when you started using it\n- how often you use it\nand explain why you find it useful.", category: "Part 2" },
  { title: "Describe a time when bad weather affected your plans", content: "You should say:\n- what your plans were\n- what the weather was like\n- how your plans changed\nand explain how you felt about it.", category: "Part 2" },
  { title: "Describe a piece of local news that interested you", content: "You should say:\n- what the news was about\n- how you heard about it\n- who was involved\nand explain why it interested you.", category: "Part 2" },
  { title: "Describe a gift you made by hand for someone", content: "You should say:\n- what the gift was\n- who you gave it to\n- how you made it\nand explain how the person reacted.", category: "Part 2" },
  { title: "Describe a time you shared something with others", content: "You should say:\n- what you shared\n- who you shared it with\n- why you shared it\nand explain how you felt about sharing.", category: "Part 2" },
  { title: "Describe a quiet place you like to go to", content: "You should say:\n- where it is\n- how you found this place\n- what you do there\nand explain why you like the quietness.", category: "Part 2" },
  { title: "Describe a time you used a foreign language for the first time", content: "You should say:\n- what language it was\n- where you were\n- who you were talking to\nand explain how you felt about the experience.", category: "Part 2" },
  { title: "Describe a building with an interesting design", content: "You should say:\n- where the building is\n- what it looks like\n- what it is used for\nand explain why you think the design is interesting.", category: "Part 2" },
  { title: "Describe a time you were proud of a family member", content: "You should say:\n- who the family member is\n- what they did\n- when it happened\nand explain why you felt proud.", category: "Part 2" },
  { title: "Describe a healthy habit you have", content: "You should say:\n- what the habit is\n- when you started doing it\n- how you maintain it\nand explain why you think it is healthy.", category: "Part 2" },
  { title: "Describe a time you attended a celebration or party", content: "You should say:\n- what the celebration was for\n- where it took place\n- who was there\nand explain what you enjoyed most about it.", category: "Part 2" },
  { title: "Describe something you would like to learn in the future", content: "You should say:\n- what it is\n- why you want to learn it\n- how you plan to learn it\nand explain how it would help you.", category: "Part 2" },
  { title: "Describe a time you spent money on something you didn't need", content: "You should say:\n- what you bought\n- why you bought it\n- how much it cost\nand explain how you felt afterwards.", category: "Part 2" }
];

const MOCK_PART3: QuestionItem[] = [
  { title: "Role Models in Society", content: "Q1. Do you think celebrities are good role models for young people?\nQ2. How has the concept of a role model changed over time?\nQ3. Should schools teach students about influential historical figures?\nQ4. Is it better to have a role model who is a family member or a public figure?", category: "Part 3" },
  { title: "Leadership and Influence", content: "Q1. What qualities make a good leader?\nQ2. Do you think leaders are born or made?\nQ3. How has leadership style changed in the modern workplace?\nQ4. Can ordinary people influence society without being leaders?", category: "Part 3" },
  { title: "Tourism and Culture", content: "Q1. How does tourism affect local cultures?\nQ2. Do you think mass tourism is damaging historical sites?\nQ3. Should governments limit the number of tourists in certain areas?\nQ4. How can tourists be more respectful of local customs?", category: "Part 3" },
  { title: "Travel and Personal Growth", content: "Q1. How does travelling help people grow personally?\nQ2. Do you think young people should travel before starting their career?\nQ3. Is it better to travel alone or with others?\nQ4. Has technology made travel too easy and less meaningful?", category: "Part 3" },
  { title: "Technology and Daily Life", content: "Q1. How has technology changed the way people communicate?\nQ2. Do you think people are too dependent on technology?\nQ3. What are the risks of artificial intelligence for society?\nQ4. Should children be limited in their use of electronic devices?", category: "Part 3" },
  { title: "Social Media Impact", content: "Q1. Does social media bring people closer or push them apart?\nQ2. How has social media changed the way news is consumed?\nQ3. Should social media platforms be regulated by governments?\nQ4. Do you think social media affects people's mental health?", category: "Part 3" },
  { title: "Online vs Offline Learning", content: "Q1. Is online learning as effective as classroom learning?\nQ2. What are the advantages and disadvantages of studying online?\nQ3. Do you think online education will replace traditional schools?\nQ4. How can technology improve education in rural areas?", category: "Part 3" },
  { title: "Education System", content: "Q1. Do you think the current education system prepares students well for the real world?\nQ2. Should education focus more on practical skills or academic knowledge?\nQ3. How important is it for students to learn a second language?\nQ4. Do exams accurately measure a student's ability?", category: "Part 3" },
  { title: "Lifelong Learning", content: "Q1. Why is it important for adults to continue learning?\nQ2. What motivates people to learn new things after finishing school?\nQ3. Should employers provide training opportunities for their workers?\nQ4. How has the internet made lifelong learning easier?", category: "Part 3" },
  { title: "Environmental Protection", content: "Q1. Whose responsibility is it to protect the environment — individuals or governments?\nQ2. Do you think enough is being done to combat climate change?\nQ3. How can cities become more environmentally friendly?\nQ4. Should companies be punished for damaging the environment?", category: "Part 3" },
  { title: "Urbanisation and Nature", content: "Q1. Is it important for cities to have green spaces?\nQ2. How does urbanisation affect wildlife?\nQ3. Do people in cities have less connection with nature?\nQ4. What can governments do to balance development and conservation?", category: "Part 3" },
  { title: "Work-Life Balance", content: "Q1. Is work-life balance achievable in today's world?\nQ2. Why do some people work too much?\nQ3. Should governments enforce shorter working hours?\nQ4. How does overworking affect people's health and relationships?", category: "Part 3" },
  { title: "Future of Work", content: "Q1. How will jobs change in the next 20 years?\nQ2. Do you think robots will replace human workers?\nQ3. What skills will be most important in the future job market?\nQ4. Should people change careers multiple times in their lives?", category: "Part 3" },
  { title: "Health and Lifestyle", content: "Q1. Why do some people find it hard to maintain a healthy lifestyle?\nQ2. Should governments do more to promote public health?\nQ3. Is mental health as important as physical health?\nQ4. How has the concept of a healthy diet changed over the years?", category: "Part 3" },
  { title: "Ageing Society", content: "Q1. What challenges does an ageing population create for society?\nQ2. Should the retirement age be increased?\nQ3. How can society better support elderly people?\nQ4. Do you think younger and older generations understand each other?", category: "Part 3" },
  { title: "Consumerism", content: "Q1. Do you think people today buy too many things?\nQ2. How does advertising influence consumer behaviour?\nQ3. Is the throwaway culture harming the environment?\nQ4. Should people be encouraged to buy locally produced goods?", category: "Part 3" },
  { title: "Wealth and Happiness", content: "Q1. Does money guarantee happiness?\nQ2. Why is the gap between rich and poor growing?\nQ3. Should wealthy people have a responsibility to help others?\nQ4. How does economic status affect people's opportunities in life?", category: "Part 3" },
  { title: "Tradition vs Modernity", content: "Q1. Is it important to preserve cultural traditions?\nQ2. How can traditional customs coexist with modern life?\nQ3. Are young people less interested in traditions than older generations?\nQ4. What happens when traditions conflict with modern values?", category: "Part 3" },
  { title: "Globalisation and Identity", content: "Q1. How has globalisation affected local cultures?\nQ2. Do you think globalisation has more advantages or disadvantages?\nQ3. Is it possible to maintain cultural identity in a globalised world?\nQ4. Should countries protect their local industries from foreign competition?", category: "Part 3" },
  { title: "Media and Truth", content: "Q1. How can people identify fake news?\nQ2. Do you think the media has too much power over public opinion?\nQ3. Should there be stricter regulations on what the media can publish?\nQ4. How has the way people get news changed over the past decade?", category: "Part 3" },
  { title: "Housing and City Planning", content: "Q1. Why is housing becoming more expensive in many cities?\nQ2. Should governments provide affordable housing?\nQ3. How does urban planning affect people's quality of life?\nQ4. Do you think people will live differently in cities in the future?", category: "Part 3" },
  { title: "Crime and Punishment", content: "Q1. What are the main causes of crime in society?\nQ2. Do you think harsh punishments reduce crime?\nQ3. Should the focus be more on rehabilitation than punishment?\nQ4. How can communities help prevent crime?", category: "Part 3" },
  { title: "Art and Creativity", content: "Q1. Is art important for society?\nQ2. Should governments fund the arts?\nQ3. Do you think creativity can be taught?\nQ4. How has technology changed the way people create and consume art?", category: "Part 3" },
  { title: "Competition vs Cooperation", content: "Q1. Is competition always beneficial?\nQ2. How do you think schools can encourage more cooperation among students?\nQ3. In the workplace, is competition or teamwork more important?\nQ4. Does too much competition have negative effects on people?", category: "Part 3" },
  { title: "Decision Making", content: "Q1. Do young people make decisions differently from older people?\nQ2. How does information overload affect decision-making?\nQ3. Should important decisions be made quickly or carefully?\nQ4. Do you think people regret decisions more when they are older?", category: "Part 3" },
  { title: "Food Culture and Globalisation", content: "Q1. Why is food culture important to a country's identity?\nQ2. Do you think globalisation has made food less authentic?\nQ3. Should schools teach children about healthy eating habits?\nQ4. How has the way people eat changed in the past 20 years?", category: "Part 3" },
  { title: "Films and Society", content: "Q1. Can movies change the way people think about social issues?\nQ2. Why do some people prefer foreign films over domestic ones?\nQ3. Do you think films today are too focused on entertainment rather than meaning?\nQ4. Should governments censor certain movies?", category: "Part 3" },
  { title: "Preserving Historical Sites", content: "Q1. Why is it important to preserve old buildings?\nQ2. Who should pay for the maintenance of historical buildings — governments or private companies?\nQ3. Do you think modern architecture is as valuable as historical architecture?\nQ4. How can historical sites attract more visitors without being damaged?", category: "Part 3" },
  { title: "Patience in Modern Life", content: "Q1. Why are people less patient today compared to the past?\nQ2. Does instant technology make people more impatient?\nQ3. In what situations is patience most important?\nQ4. How can people learn to be more patient?", category: "Part 3" },
  { title: "Fashion and Identity", content: "Q1. Does what people wear reflect their personality?\nQ2. How has fashion changed in your country over the years?\nQ3. Do you think school uniforms are a good idea?\nQ4. Is the fashion industry harmful to the environment?", category: "Part 3" },
  { title: "School Subjects and Career Choices", content: "Q1. Should students be allowed to choose all their own subjects?\nQ2. Do you think some subjects are more important than others?\nQ3. How do school subjects influence career choices later in life?\nQ4. Should the school curriculum change more often to keep up with the modern world?", category: "Part 3" },
  { title: "Advice and Guidance", content: "Q1. Do young people today listen to advice from older generations?\nQ2. Is it better to learn from your own mistakes or take advice from others?\nQ3. Why do some people find it hard to give good advice?\nQ4. Has the internet replaced traditional sources of advice like parents and teachers?", category: "Part 3" },
  { title: "Exercise and Public Health", content: "Q1. Why don't some people exercise even though they know it's healthy?\nQ2. Should governments invest more in public sports facilities?\nQ3. Is competition in sport good for children's development?\nQ4. How has the fitness industry changed in recent years?", category: "Part 3" },
  { title: "Memory and Modern Life", content: "Q1. Why do people forget things more easily nowadays?\nQ2. Do you think technology helps or hinders our ability to remember?\nQ3. What methods do people use to improve their memory?\nQ4. Is forgetfulness a bigger problem in older people or younger people?", category: "Part 3" },
  { title: "The Internet and Information", content: "Q1. Is all the information on the internet reliable?\nQ2. How has the internet changed the way people learn?\nQ3. Do you think too much internet use is bad for people?\nQ4. Should the internet be free for everyone?", category: "Part 3" },
  { title: "Creativity in the Modern World", content: "Q1. Can creativity be learned or is it something you are born with?\nQ2. Why is creativity important in the workplace?\nQ3. Do schools do enough to encourage creativity in children?\nQ4. Has technology made people more or less creative?", category: "Part 3" },
  { title: "Laws and Society", content: "Q1. Why is it important for people to follow laws?\nQ2. Do you think laws should change as society changes?\nQ3. Are there any laws that you think are too strict or too lenient?\nQ4. How can governments make sure people understand and obey laws?", category: "Part 3" },
  { title: "Professionalism and Work Ethic", content: "Q1. What makes someone truly professional at their job?\nQ2. Is passion or skill more important in being good at a job?\nQ3. How do different cultures define a good employee?\nQ4. Should companies reward employees who go above and beyond?", category: "Part 3" },
  { title: "Family Values and Traditions", content: "Q1. Are family traditions still important in modern society?\nQ2. How do family traditions differ between generations?\nQ3. Should parents force their children to follow family traditions?\nQ4. How can families maintain traditions when living far apart?", category: "Part 3" },
  { title: "Fast Learning and Adaptability", content: "Q1. Is the ability to learn quickly becoming more important today?\nQ2. Do some people learn faster than others, and if so, why?\nQ3. How can education systems help students become faster learners?\nQ4. Is there a downside to learning something too quickly?", category: "Part 3" },
  { title: "Local vs Global Commerce", content: "Q1. Are traditional markets still relevant in the age of online shopping?\nQ2. What are the benefits of buying from local markets?\nQ3. How has technology changed the way small businesses operate?\nQ4. Should governments do more to support local businesses?", category: "Part 3" },
  { title: "Environmental Responsibility", content: "Q1. Should individuals or governments take more responsibility for environmental issues?\nQ2. Do you think environmental education in schools is effective?\nQ3. How can technology help solve environmental problems?\nQ4. Will future generations be more environmentally conscious?", category: "Part 3" },
  { title: "Opinions and Communication", content: "Q1. Why do some people find it difficult to express their opinions?\nQ2. Is it important to be able to persuade others?\nQ3. How has social media changed the way people share opinions?\nQ4. Do you think public speaking skills should be taught in schools?", category: "Part 3" },
  { title: "Adventure and Risk-Taking", content: "Q1. Why are adventure sports becoming more popular?\nQ2. Should there be age restrictions for extreme sports?\nQ3. Do you think risk-taking is a positive quality?\nQ4. How can people balance the desire for adventure with safety?", category: "Part 3" },
  { title: "Change and Self-Improvement", content: "Q1. Why do some people find it hard to make changes in their lives?\nQ2. Is it better to make big changes all at once or small changes gradually?\nQ3. How does society influence people's desire to change?\nQ4. Do you think people change more as they get older?", category: "Part 3" },
  { title: "Childhood and Development", content: "Q1. How have children's toys changed compared to the past?\nQ2. Do you think electronic toys are better than traditional ones?\nQ3. What role do toys play in children's development?\nQ4. Should parents limit the number of toys their children have?", category: "Part 3" },
  { title: "Wildlife and Conservation", content: "Q1. Why is it important to protect endangered species?\nQ2. Should animals be kept in captivity for educational purposes?\nQ3. How has urbanisation affected wildlife in your country?\nQ4. Do you think wildlife documentaries raise awareness effectively?", category: "Part 3" },
  { title: "Music and Emotions", content: "Q1. Why does music have such a strong effect on people's emotions?\nQ2. Do you think music taste reflects a person's personality?\nQ3. How has the music industry changed with streaming platforms?\nQ4. Should music education be compulsory in schools?", category: "Part 3" },
  { title: "Decision-Making and Consequences", content: "Q1. Do people today have too many choices?\nQ2. How do cultural values influence the decisions people make?\nQ3. Should young people make their own important decisions or rely on parents?\nQ4. Is it better to make decisions based on logic or feelings?", category: "Part 3" },
  { title: "Green Spaces and Urban Living", content: "Q1. Are parks and green spaces important for people living in cities?\nQ2. How do green spaces affect mental health?\nQ3. Should governments invest more in creating public parks?\nQ4. Do you think people spend enough time outdoors?", category: "Part 3" },
  { title: "Teaching and Education Quality", content: "Q1. What qualities make an excellent teacher?\nQ2. Should teachers be paid more than they currently are?\nQ3. How has the role of teachers changed with technology?\nQ4. Is the relationship between students and teachers different now compared to the past?", category: "Part 3" },
  { title: "Elderly People and Society", content: "Q1. What can young people learn from older generations?\nQ2. How should society better care for its elderly?\nQ3. Do you think elderly people are treated with enough respect today?\nQ4. How has the role of grandparents changed in modern families?", category: "Part 3" },
  { title: "Museums and Cultural Preservation", content: "Q1. Should museums return historical artefacts to their countries of origin?\nQ2. How can museums attract younger visitors?\nQ3. Is it better to experience art in person or online?\nQ4. What role do museums play in preserving national identity?", category: "Part 3" },
  { title: "Apps and Digital Dependency", content: "Q1. Are people becoming too dependent on mobile apps?\nQ2. How have apps changed the way people manage their daily lives?\nQ3. Should there be regulations on how apps collect personal data?\nQ4. Do you think some apps are designed to be addictive?", category: "Part 3" },
  { title: "Weather and Climate Impact", content: "Q1. How does extreme weather affect people's daily lives?\nQ2. Do you think climate change is making weather patterns more unpredictable?\nQ3. Should governments do more to prepare for natural disasters?\nQ4. How has technology helped people deal with bad weather?", category: "Part 3" },
  { title: "News and Media Literacy", content: "Q1. How do most people in your country get their news?\nQ2. Do you think local news is as important as international news?\nQ3. How can people tell if a news source is trustworthy?\nQ4. Has social media made news reporting better or worse?", category: "Part 3" },
  { title: "Handmade vs Mass-Produced", content: "Q1. Do you think handmade gifts are more meaningful than bought ones?\nQ2. Why is handmade craftsmanship declining in many countries?\nQ3. Should schools teach more practical crafting skills?\nQ4. Is there still a market for handmade goods in the modern world?", category: "Part 3" },
  { title: "Sharing and the Sharing Economy", content: "Q1. Is sharing becoming more or less common in modern society?\nQ2. How has the sharing economy (like ride-sharing) changed people's lives?\nQ3. Do people share more when they are younger?\nQ4. What are the benefits and risks of sharing personal resources?", category: "Part 3" },
  { title: "Silence, Solitude and Mental Health", content: "Q1. Is it hard for people to find quiet places in modern cities?\nQ2. Why do some people prefer solitude while others prefer company?\nQ3. Do you think noise pollution is a serious problem?\nQ4. How does spending time alone benefit people's mental health?", category: "Part 3" },
  { title: "Language, Culture and Identity", content: "Q1. Is learning a foreign language important for career development?\nQ2. Do you think translation technology will make language learning unnecessary?\nQ3. How does speaking another language change the way you think?\nQ4. Should countries have only one official language?", category: "Part 3" },
  { title: "Architecture and Society", content: "Q1. How does architecture reflect a country's culture?\nQ2. Should cities preserve old buildings or replace them with modern ones?\nQ3. Do you think sustainable architecture is the future?\nQ4. How do building designs affect the mood of people living or working in them?", category: "Part 3" },
  { title: "Family Pride and Values", content: "Q1. Is it important for family members to support each other's achievements?\nQ2. How do families celebrate success in your culture?\nQ3. Do you think parents put too much pressure on children to succeed?\nQ4. Has the definition of family success changed over time?", category: "Part 3" },
  { title: "Health Habits and Prevention", content: "Q1. Why is it so hard for people to develop healthy habits?\nQ2. Should the government promote healthy lifestyles through campaigns?\nQ3. Do you think people are more health-conscious now than in the past?\nQ4. How can technology help people maintain healthy habits?", category: "Part 3" },
  { title: "Celebrations and Social Bonding", content: "Q1. Why are celebrations important in human cultures?\nQ2. How have celebrations changed compared to the past?\nQ3. Do you think people spend too much money on parties and celebrations?\nQ4. Are traditional celebrations losing their significance in modern society?", category: "Part 3" },
  { title: "Lifelong Learning and Motivation", content: "Q1. What motivates adults to continue learning new skills?\nQ2. Do you think online courses are as effective as face-to-face learning?\nQ3. Should employers give workers time to learn new skills during work hours?\nQ4. How will the skills people need change in the next decade?", category: "Part 3" },
  { title: "Consumer Behaviour and Impulse Buying", content: "Q1. Why do people often buy things they don't really need?\nQ2. How does advertising influence impulse buying?\nQ3. Should there be limits on how companies market products to young people?\nQ4. Do you think minimalism is a realistic lifestyle choice?", category: "Part 3" }
];

function extractSubQuestions(content: string): string[] {
  return content.split("\n").filter(line => /^Q\d+\.\s/.test(line.trim()));
}

interface ScoreResult {
  fluency_coherence: { score: number; feedback: string; tips?: string };
  lexical_resource: { score: number; feedback: string; tips?: string };
  grammatical_range: { score: number; feedback: string; tips?: string };
  pronunciation: { score: number; feedback: string; tips?: string };
  overall_score: number;
  grammar_errors: { original: string; correction: string; explanation: string }[];
  vocabulary_errors: { original: string; suggestion: string; explanation: string }[];
  overall_feedback: string;
}

interface AttemptRecord {
  attempt: number;
  transcript: string;
  scoreResult: ScoreResult;
  timestamp: Date;
}

const SpeakingPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"part1" | "part2" | "part3" | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionItem>({ title: "", content: "", category: "" });
  
  // 🎙️ 录音状态管理
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'paused'>('idle');
  const recordingStateRef = useRef<'idle' | 'recording' | 'paused'>('idle');

  const [transcript, setTranscript] = useState("");
  const [isScoring, setIsScoring] = useState(false);
  
  // ⏳ 动态加载状态播报器
  const [loadingText, setLoadingText] = useState("AI 考官正在仔细聆听...");

  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null);
  const [attemptHistory, setAttemptHistory] = useState<AttemptRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [currentSubQ, setCurrentSubQ] = useState(0);
  const [seenPart1, setSeenPart1] = useState<Set<number>>(new Set());
  const [seenPart2, setSeenPart2] = useState<Set<number>>(new Set());
  const [seenPart3, setSeenPart3] = useState<Set<number>>(new Set());

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [redeemCode, setRedeemCode] = useState("");
  const [isRedeeming, setIsRedeeming] = useState(false);

  const [dbPart1] = useState<QuestionItem[]>(MOCK_PART1);
  const [dbPart2] = useState<QuestionItem[]>(MOCK_PART2);
  const [dbPart3] = useState<QuestionItem[]>(MOCK_PART3);
  const [customPart1, setCustomPart1] = useState<QuestionItem[]>([]);
  const [customPart2, setCustomPart2] = useState<QuestionItem[]>([]);
  const [customPart3, setCustomPart3] = useState<QuestionItem[]>([]);

  const [countdown, setCountdown] = useState<number | null>(null);
  const [countdownActive, setCountdownActive] = useState(false);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 🛡️ 电焊机模式的核心
  const recognitionRef = useRef<any>(null);
  const baseTranscriptRef = useRef(""); 

  const part1Topics = [...dbPart1, ...customPart1];
  const part2Topics = [...dbPart2, ...customPart2];
  const part3Topics = [...dbPart3, ...customPart3];

  const subQuestions = useMemo(() => {
    if (activeTab === "part2") return [];
    return extractSubQuestions(currentQuestion.content);
  }, [currentQuestion, activeTab]);

  useEffect(() => {
    recordingStateRef.current = recordingState;
  }, [recordingState]);

  // 💡 动态进度播报逻辑
  useEffect(() => {
    if (!isScoring) return;
    const messages = [
      "正在分析发音与流利度...",
      "正在评估词汇与语法丰富度...",
      "正在精准捕捉语法结构错误...",
      "正在为你生成专属高阶词汇建议...",
      "正在汇总出具综合提分报告...",
      "即将出分，请稍候..."
    ];
    let i = 0;
    setLoadingText(messages[0]);
    const timer = setInterval(() => {
      i = (i + 1) % messages.length;
      setLoadingText(messages[i]);
    }, 4500);
    return () => clearInterval(timer);
  }, [isScoring]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("已成功退出登录");
    navigate("/auth");
  };

  const playBeep = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = "sine";
      gain.gain.value = 0.5;
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch {}
  }, []);

  const startCountdown = useCallback(() => {
    setCountdown(60);
    setCountdownActive(true);
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(countdownRef.current!);
          countdownRef.current = null;
          setCountdownActive(false);
          playBeep();
          toast.success("准备时间结束，请开始作答！", { duration: 4000 });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [playBeep]);

  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // 💡 新增：专门处理小题切换的函数，确保清理上一题的答题痕迹
  const handleSubQuestionChange = (newIndex: number) => {
    setCurrentSubQ(newIndex);
    // 彻底擦除输入框内容和底层记录
    setTranscript("");
    baseTranscriptRef.current = "";
    // 关闭可能正在进行的录音
    setRecordingState('idle');
    recordingStateRef.current = 'idle'; // 同步修改避免自动重启
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    // 清除上一个问题的打分结果
    setScoreResult(null);
  };

  const pickRandomQuestion = useCallback(() => {
    const pool = activeTab === "part1" ? part1Topics : activeTab === "part2" ? part2Topics : part3Topics;
    if (pool.length === 0) return;

    const seen = activeTab === "part1" ? seenPart1 : activeTab === "part2" ? seenPart2 : seenPart3;
    const setSeen = activeTab === "part1" ? setSeenPart1 : activeTab === "part2" ? setSeenPart2 : setSeenPart3;

    let unseen = pool.map((_, i) => i).filter(i => !seen.has(i));
    if (unseen.length === 0) {
      toast.info("🎉 你已浏览完所有题目，题库将重新开始！");
      setSeen(new Set());
      unseen = pool.map((_, i) => i);
    }
    const idx = unseen[Math.floor(Math.random() * unseen.length)];
    setSeen(prev => new Set(prev).add(idx));
    setCurrentQuestion(pool[idx]);
    
    setTranscript("");
    baseTranscriptRef.current = "";
    setRecordingState('idle');
    if (recognitionRef.current) recognitionRef.current.stop();

    setScoreResult(null);
    setAttemptHistory([]);
    setShowHistory(false);
    setCountdown(null);
    setCountdownActive(false);
    setCurrentSubQ(0);
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
  }, [activeTab, part1Topics, part2Topics, part3Topics, seenPart1, seenPart2, seenPart3]);

  useEffect(() => {
    if (activeTab && (part1Topics.length > 0 || part2Topics.length > 0 || part3Topics.length > 0)) pickRandomQuestion();
  }, [activeTab, dbPart1, dbPart2, dbPart3]);

  const initRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("您的浏览器不支持语音识别，请使用 Chrome 浏览器");
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          baseTranscriptRef.current += event.results[i][0].transcript + " ";
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setTranscript(baseTranscriptRef.current + interim);
    };

    recognition.onerror = (event: any) => {
      if (event.error !== "no-speech") console.error("语音识别出错: ", event.error);
    };

    recognition.onend = () => {
      if (recordingStateRef.current === 'recording') {
        try { recognition.start(); } catch {}
      }
    };

    return recognition;
  };

  const handleStartRecording = () => {
    baseTranscriptRef.current = transcript;
    setRecordingState('recording');
    const rec = initRecognition();
    if (rec) {
      rec.start();
      recognitionRef.current = rec;
      toast.info("开始录音，您可以随时暂停思考或修改文本");
    }
  };

  const handlePauseRecording = () => {
    setRecordingState('paused');
    if (recognitionRef.current) {
      recognitionRef.current.stop(); 
    }
  };

  const handleResumeRecording = () => {
    baseTranscriptRef.current = transcript;
    setRecordingState('recording');
    if (recognitionRef.current) {
      try { recognitionRef.current.start(); } catch {}
    } else {
      const rec = initRecognition();
      if (rec) {
        rec.start();
        recognitionRef.current = rec;
      }
    }
  };

  const handleStopRecording = () => {
    setRecordingState('idle');
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const checkUsageAndSubmit = async () => {
    const text = transcript.trim();
    if (!text) {
      toast.error("请先录音或输入回答");
      return;
    }

    setIsScoring(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!profile) return;

      const today = new Date().toISOString().split('T')[0];
      let freeUsed = profile.free_speaking_used;
      let paidLeft = profile.paid_speaking_left;
      let isUnlimited = profile.is_unlimited;

      if (profile.last_speaking_date !== today) {
        freeUsed = 0;
        await supabase
          .from('profiles')
          .update({ free_speaking_used: 0, last_speaking_date: today })
          .eq('id', user.id);
      }

      if (isUnlimited) {
        await executeScoring(text);
      } else if (freeUsed < 1) {
        await supabase.from('profiles').update({ free_speaking_used: freeUsed + 1 }).eq('id', user.id);
        toast.info("已使用今日 1 次免费模考机会");
        await executeScoring(text);
      } else if (paidLeft > 0) {
        await supabase.from('profiles').update({ paid_speaking_left: paidLeft - 1 }).eq('id', user.id);
        toast.info(`使用付费包次数，剩余 ${paidLeft - 1} 次`);
        await executeScoring(text);
      } else {
        setIsScoring(false);
        setShowPaymentModal(true);
      }
    } catch (err) {
      console.error(err);
      toast.error("查验身份失败，请检查网络");
      setIsScoring(false);
    }
  };

  const executeScoring = async (text: string) => {
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/speaking-score`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ transcript: text, question: currentQuestion.title }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "评分失败" }));
        throw new Error(err.error || "评分失败");
      }

      const result = await resp.json();
      if (result.error) throw new Error(result.error);
      
      setScoreResult(result);

      const newAttempt: AttemptRecord = {
        attempt: attemptHistory.length + 1,
        transcript: text,
        scoreResult: result,
        timestamp: new Date(),
      };
      setAttemptHistory(prev => [...prev, newAttempt]);

    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "评分请求失败，请检查网络");
    } finally {
      setIsScoring(false);
    }
  };

  const handleRedeem = async () => {
    if (!redeemCode.trim()) {
      toast.error("请输入兑换码");
      return;
    }
    setIsRedeeming(true);
    try {
      const { data, error } = await supabase.rpc('redeem_card_code', { provided_code: redeemCode.trim() });
      if (error) throw error;

      if (data === 'success') {
        toast.success("🎉 兑换成功！已为您解锁对应权限！", { duration: 4000 });
        setShowPaymentModal(false);
        setRedeemCode("");
      } else {
        toast.error(data || "兑换失败，请检查兑换码是否拼写正确");
      }
    } catch (err: any) {
      toast.error("网络错误，请稍后重试");
    } finally {
      setIsRedeeming(false);
    }
  };

  const openPaymentWindow = (url: string) => {
    const width = 900;
    const height = 700;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    window.open(
      url, 
      'PaymentWindow', 
      `width=${width},height=${height},top=${top},left=${left},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
    );
    toast.info("已为您打开官方安全支付通道，获取兑换码后请在此处激活！");
  };

  const retryPractice = () => {
    setTranscript("");
    baseTranscriptRef.current = "";
    setScoreResult(null);
  };

  const calculateIeltsScore = (fc: number, lr: number, gra: number, pr: number) => {
    const avg = (fc + lr + gra + pr) / 4;
    const remainder = avg % 1;
    const base = Math.floor(avg);
    if (remainder >= 0.75) return base + 1;
    if (remainder >= 0.25) return base + 0.5;
    return base;
  };

  const getScoreColor = (score: number) => {
    if (score >= 7) return "text-green-600";
    if (score >= 5) return "text-foreground";
    return "text-destructive";
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const strictOverallScore = scoreResult ? calculateIeltsScore(
    scoreResult.fluency_coherence.score,
    scoreResult.lexical_resource.score,
    scoreResult.grammatical_range.score,
    scoreResult.pronunciation.score
  ) : 0;

  if (!activeTab) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card sticky top-0 z-10">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/">
                <Button variant="ghost" size="icon" className="shrink-0"><ArrowLeft className="w-4 h-4" /></Button>
              </Link>
              <h1 className="text-lg font-bold text-foreground">雅思口语练习</h1>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
              <LogOut className="w-4 h-4 mr-1" /> 退出
            </Button>
          </div>
        </header>

        <main className="container mx-auto px-6 py-8 max-w-2xl space-y-6">
          <div className="text-center space-y-2 animate-fade-in">
            <h2 className="text-2xl font-bold text-foreground">选择练习类型</h2>
            <p className="text-muted-foreground text-sm">2025-2026 中国区真题题库</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <button onClick={() => setActiveTab("part1")} className="bg-card border rounded-xl p-6 text-left hover:border-primary/40 transition-all flex flex-col">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4"><Mic className="w-6 h-6 text-primary" /></div>
              <h3 className="text-lg font-bold text-foreground mb-2">Part 1</h3>
              <p className="text-sm text-muted-foreground flex-1">短问短答练习</p>
            </button>
            <button onClick={() => setActiveTab("part2")} className="bg-card border rounded-xl p-6 text-left hover:border-secondary/40 transition-all flex flex-col">
              <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-4"><Mic className="w-6 h-6 text-secondary" /></div>
              <h3 className="text-lg font-bold text-foreground mb-2">Part 2</h3>
              <p className="text-sm text-muted-foreground flex-1">话题卡长篇独白</p>
            </button>
            <button onClick={() => setActiveTab("part3")} className="bg-card border rounded-xl p-6 text-left hover:border-accent-foreground/40 transition-all flex flex-col">
              <div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center mb-4"><Mic className="w-6 h-6 text-accent-foreground" /></div>
              <h3 className="text-lg font-bold text-foreground mb-2">Part 3</h3>
              <p className="text-sm text-muted-foreground flex-1">深入批判性讨论</p>
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="shrink-0" onClick={() => { setActiveTab(null); setScoreResult(null); setTranscript(""); handleStopRecording(); }}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-lg font-bold text-foreground">
              雅思口语 {activeTab === "part1" ? "Part 1" : activeTab === "part2" ? "Part 2" : "Part 3"}
            </h1>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
            <LogOut className="w-4 h-4 mr-1" /> 退出
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-2xl space-y-6 pb-24">
        <section className="bg-card border rounded-xl p-6 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground">当前题目</h2>
            <Button variant="ghost" size="sm" onClick={pickRandomQuestion}>
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> 换一题
            </Button>
          </div>
          <h3 className="text-lg font-bold text-foreground">{currentQuestion.title}</h3>
          {currentQuestion.content && <p className="text-foreground whitespace-pre-line">{currentQuestion.content}</p>}

          {activeTab === "part2" && (
            <div className="border-t pt-4 space-y-2">
              <div className="flex items-center gap-3">
                <Button onClick={startCountdown} disabled={countdownActive} variant="outline" size="sm">
                  <Timer className="w-3.5 h-3.5 mr-1" />
                  {countdown !== null && countdown > 0 ? formatTime(countdown) : countdown === 0 ? "时间到！" : "开始1分钟准备"}
                </Button>
              </div>
              {countdownActive && countdown !== null && (
                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                  <div className="bg-primary h-full transition-all duration-1000 ease-linear" style={{ width: `${(countdown / 60) * 100}%` }} />
                </div>
              )}
            </div>
          )}
        </section>

        {subQuestions.length > 0 && (
          <section className="bg-card border rounded-xl p-4 animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-muted-foreground">第 {currentSubQ + 1} / {subQuestions.length} 小题</span>
              <div className="flex items-center gap-1">
                {/* 💡 这里用上了我们新写的清空函数 */}
                <Button variant="ghost" size="icon" className="h-7 w-7" disabled={currentSubQ === 0} onClick={() => handleSubQuestionChange(currentSubQ - 1)}>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" disabled={currentSubQ >= subQuestions.length - 1} onClick={() => handleSubQuestionChange(currentSubQ + 1)}>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
              <p className="text-sm font-medium text-foreground">{subQuestions[currentSubQ]}</p>
            </div>
          </section>
        )}

        <section className="bg-card border rounded-xl p-6 space-y-4 animate-fade-in">
          <div className="flex justify-center gap-3">
            {recordingState === 'idle' ? (
              <Button onClick={handleStartRecording} size="lg" className="px-8 bg-primary hover:bg-primary/90 text-white shadow-md">
                <Mic className="w-4 h-4 mr-2" /> 开始回答
              </Button>
            ) : (
              <>
                {recordingState === 'recording' ? (
                  <Button onClick={handlePauseRecording} size="lg" variant="outline" className="px-6 border-orange-500 text-orange-500 hover:bg-orange-50">
                    <Pause className="w-4 h-4 mr-2" /> 暂停 / 修改文本
                  </Button>
                ) : (
                  <Button onClick={handleResumeRecording} size="lg" variant="outline" className="px-6 border-green-500 text-green-500 hover:bg-green-50">
                    <Play className="w-4 h-4 mr-2" /> 继续录音
                  </Button>
                )}
                <Button onClick={handleStopRecording} size="lg" variant="destructive" className="px-6 shadow-sm">
                  <MicOff className="w-4 h-4 mr-2" /> 结束回答
                </Button>
              </>
            )}
          </div>
        </section>

        <section className="bg-card border rounded-xl p-6 space-y-4 animate-fade-in">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold text-foreground">你的回答</h2>
            {(recordingState === 'paused' || transcript) && !scoreResult && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">您可以直接在框内修改纠正文字</span>
            )}
          </div>
          <textarea
            value={transcript}
            onChange={(e) => {
              setTranscript(e.target.value);
              baseTranscriptRef.current = e.target.value;
            }}
            disabled={isScoring || scoreResult !== null}
            placeholder={recordingState === 'idle' ? "点击上方按钮开始录音，或直接在此打字输入回答..." : "正在聆听..."}
            className={`w-full min-h-[120px] text-foreground text-sm leading-relaxed rounded-lg p-4 border outline-none resize-y transition-colors ${
              recordingState === 'recording' ? 'bg-primary/5 border-primary/30 ring-2 ring-primary/20' : 'bg-muted/50 border-transparent focus:border-primary/50 focus:bg-background'
            }`}
            style={{
              pointerEvents: 'auto',
              userSelect: 'text',
              WebkitUserSelect: 'text',
              cursor: 'text'
            }}
          />
          {!scoreResult && (transcript || recordingState !== 'idle') && (
            <Button onClick={checkUsageAndSubmit} disabled={isScoring || recordingState === 'recording'} className="w-full shadow-sm" variant="secondary">
              {isScoring ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {loadingText}</> : <><Play className="w-4 h-4 mr-2" /> 提交评分</>}
            </Button>
          )}
        </section>

        {scoreResult && (
          <section className="bg-card border rounded-xl p-6 space-y-5 animate-fade-in">
            <h2 className="text-sm font-semibold text-foreground">AI 评分结果</h2>
            <div className="text-center py-3">
              <span className="text-xs text-muted-foreground">总分</span>
              <div className={`text-5xl font-extrabold ${getScoreColor(strictOverallScore)}`}>{strictOverallScore.toFixed(1)}</div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "流利度与连贯性", data: scoreResult.fluency_coherence },
                { label: "词汇丰富度", data: scoreResult.lexical_resource },
                { label: "语法广度与准确性", data: scoreResult.grammatical_range },
                { label: "发音", data: scoreResult.pronunciation },
              ].map(({ label, data }) => (
                <div key={label} className="bg-muted/50 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{label}</span>
                    <span className={`text-lg font-bold ${getScoreColor(data.score)}`}>{data.score.toFixed(1)}</span>
                  </div>
                  <p className="text-xs text-foreground">{data.feedback}</p>
                </div>
              ))}
            </div>

            {scoreResult.grammar_errors?.length > 0 && (
              <div className="space-y-2 mt-4">
                <h3 className="text-sm font-semibold text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> 语法纠错
                </h3>
                {scoreResult.grammar_errors.slice(0, 5).map((err, i) => (
                  <div key={i} className="bg-destructive/5 border border-destructive/20 rounded-lg p-3 text-sm space-y-1">
                    <div>
                      <span className="text-muted-foreground line-through decoration-destructive/50">{err.original}</span>
                      <span className="mx-2">→</span>
                      <span className="text-destructive font-medium">{err.correction}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{err.explanation}</p>
                  </div>
                ))}
              </div>
            )}

            {scoreResult.vocabulary_errors?.length > 0 && (
              <div className="space-y-2 mt-4">
                <h3 className="text-sm font-semibold text-primary flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> 用词建议
                </h3>
                {scoreResult.vocabulary_errors.map((err, i) => (
                  <div key={i} className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-sm space-y-1">
                    <div>
                      <span className="text-muted-foreground">{err.original}</span>
                      <span className="mx-2">→</span>
                      <span className="text-primary font-medium">{err.suggestion}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{err.explanation}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-foreground">{scoreResult.overall_feedback}</p>
            </div>
            <div className="flex gap-3">
              <Button onClick={retryPractice} className="flex-1" variant="secondary"><RotateCcw className="w-4 h-4 mr-2" /> 再练一次</Button>
              <Button onClick={pickRandomQuestion} className="flex-1" variant="outline"><RefreshCw className="w-4 h-4 mr-2" /> 下一题</Button>
            </div>
          </section>
        )}
      </main>

      {showPaymentModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[50] flex items-center justify-center p-4">
          <div className="bg-card border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-2 border-b bg-muted/30 relative">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                <Crown className="w-6 h-6 text-orange-500" />
              </div>
              <h2 className="text-xl font-extrabold text-foreground">今日免费次数已用完</h2>
              <p className="text-sm text-muted-foreground">获取极速深度评分反馈，高效击破口语瓶颈</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">
                🛡️ 本站由官方合作平台「链动小铺」提供安全担保交易与发卡服务
              </p>
            </div>

            <div className="p-6 space-y-5">
              <div className="space-y-3">
                <div className="border border-muted-foreground/20 rounded-xl p-4 flex justify-between items-center bg-muted/10">
                  <div>
                    <div className="font-bold text-foreground text-sm">尝鲜体验包 <span className="text-xs font-normal text-muted-foreground">(6次)</span></div>
                    <div className="text-xs text-muted-foreground line-through mt-0.5">原价 ¥12.00</div>
                    <div className="text-lg font-black text-foreground mt-1">¥4.99</div>
                  </div>
                  <button 
                    onClick={() => openPaymentWindow("https://pay.ldxp.cn/item/jr2z54")}
                    className="flex items-center gap-1 bg-primary text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" /> 点击购买
                  </button>
                </div>
                
                <div className="border border-muted-foreground/20 rounded-xl p-4 flex justify-between items-center bg-muted/10">
                  <div>
                    <div className="font-bold text-foreground text-sm">常规进阶包 <span className="text-xs font-normal text-muted-foreground">(22次)</span></div>
                    <div className="text-xs text-muted-foreground line-through mt-0.5">原价 ¥44.00</div>
                    <div className="text-lg font-black text-foreground mt-1">¥16.99</div>
                  </div>
                  <button 
                    onClick={() => openPaymentWindow("https://pay.ldxp.cn/item/hisp8n")}
                    className="flex items-center gap-1 bg-primary text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" /> 点击购买
                  </button>
                </div>

                <div className="border-2 border-orange-500 rounded-xl p-4 flex justify-between items-center bg-orange-50 dark:bg-orange-900/10 relative overflow-hidden shadow-sm">
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-orange-400 to-orange-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg flex items-center shadow-sm">
                    🔥 提分必备
                  </div>
                  <div>
                    <div className="font-extrabold text-orange-600">终身畅练 VIP <span className="text-xs font-normal opacity-80">(无限次)</span></div>
                    <div className="text-xs text-orange-600/60 line-through mt-0.5">原价 ¥99.00</div>
                    <div className="text-2xl font-black text-orange-600 mt-1">¥19.99</div>
                  </div>
                  <button 
                    onClick={() => openPaymentWindow("https://pay.ldxp.cn/item/czdsph")}
                    className="flex items-center gap-1 bg-orange-500 text-white text-xs font-bold px-5 py-2.5 rounded-lg hover:bg-orange-600 transition-colors shadow-md hover:shadow-lg"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" /> 点击购买
                  </button>
                </div>
              </div>

              <div className="h-px bg-border w-full my-4"></div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground flex items-center gap-1">
                  拿到兑换码了吗？请在下方粘贴激活：
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="例如: VIP-..."
                    value={redeemCode}
                    onChange={(e) => setRedeemCode(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm rounded-lg border bg-background outline-none focus:border-orange-500 transition-colors font-mono"
                  />
                  <Button onClick={handleRedeem} disabled={isRedeeming} className="bg-foreground text-background hover:bg-foreground/90 shrink-0">
                    {isRedeeming ? <Loader2 className="w-4 h-4 animate-spin" /> : "立即解锁"}
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-3 border-t bg-muted/30 text-center">
              <button onClick={() => setShowPaymentModal(false)} className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2">
                稍后再说
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpeakingPage;