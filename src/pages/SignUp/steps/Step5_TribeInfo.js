// ./src/pages/SignUp/steps/Step5_TribeInfo.js
import React, { useState, useEffect } from 'react';
import './Step5_TribeInfo.css';

// ✅ IMPORT TỪ src/assets/images
import prayLogo from '../../../assets/images/pray-logo.png';
import judahIcon from '../../../assets/images/tribes/judah.png';
import reubenIcon from '../../../assets/images/tribes/reuben.png';
import gadIcon from '../../../assets/images/tribes/gad.png';
import asherIcon from '../../../assets/images/tribes/asher.png';
import naphtaliIcon from '../../../assets/images/tribes/naphtali.png';
import manassehIcon from '../../../assets/images/tribes/manasseh.png';
import simeonIcon from '../../../assets/images/tribes/simeon.png';
import leviIcon from '../../../assets/images/tribes/levi.png';
import issacharIcon from '../../../assets/images/tribes/issachar.png';
import zebulunIcon from '../../../assets/images/tribes/zebulun.png';
import josephIcon from '../../../assets/images/tribes/joseph.png';
import benjaminIcon from '../../../assets/images/tribes/benjamin.png';

// ✅ THÊM: Tribe Descriptions Data (ĐẦY ĐỦ 12 TRIBES - GIỐNG HỆT TribesIntroduction.js)
const tribeDescriptions = {
  1: { // Judah
    badge: '🦁👑',
    fullDescription: `📖 Scriptural Foundation

🔹 Genesis 49:8–10 (Jacob's blessing to Judah)
"Judah, your brothers shall praise you; your hand shall be on the neck of your enemies; your father's sons shall bow down before you. Judah is a lion's cub; from the prey, my son, you have gone up. He crouches down; he lies down as a lion, and as a lioness—who dares rouse him? The scepter shall not depart from Judah, nor the ruler's staff from between his feet, until Shiloh comes; and to him shall be the obedience of the peoples."

🔹 Revelation 5:5 (Jesus Christ called the Lion of the Tribe of Judah)
"Then one of the elders said to me, 'Do not weep! See, the Lion of the tribe of Judah, the Root of David, has triumphed. He is able to open the scroll and its seven seals.'"

🦁 Spiritual Meaning of the Tribe of Judah

The name Judah (יהוּדָה, Yehudah) in Hebrew means "praise, thanksgiving to Yahweh."

Judah represents worship and authority, and it is the tribe from which the Messiah (Christ) was born. That is why Jesus is called the Lion of the Tribe of Judah.

Among the twelve tribes of Israel, Judah was entrusted with leadership and warfare, and both King David and Jesus Christ came from this tribe.

💎 Blessings of the Tribe of Judah

1️⃣ Anointing of Praise and Worship 🎶
📖 Psalm 22:3: "Yet You are holy, enthroned on the praises of Israel."
👉 The descendants of Judah carry a call to worship, drawing God's presence and enthroning Him among His people.

2️⃣ Spiritual Leadership 👑
📖 Micah 5:2: "But you, Bethlehem Ephrathah, though you are small among the clans of Judah, out of you will come for me one who will be ruler over Israel, whose origins are from of old, from ancient times."
👉 Those of the Tribe of Judah are called to leadership, carrying divine authority to rule.

3️⃣ Victory in Spiritual Warfare 🦁
📖 Deuteronomy 33:7: "And this is the blessing for Judah: 'Hear, O Lord, the voice of Judah, and bring him to his people. With his hands he contended for them, and may You be a help against his adversaries.'"
👉 The Tribe of Judah embodies courage and strength, called to fight and prevail for God's Kingdom.

🔥 Spiritual Application: Embracing the Mission of Judah

If you choose to join the Tribe of Judah, your life will take on the mission of:
✅ Praising God as a worshiper, inviting His glory to dwell among His people.
✅ Rising as a courageous leader of faith, guiding brothers and sisters to victory in Christ.
✅ Walking in the anointing of spiritual warfare, pushing back the forces of darkness and advancing God's Kingdom.

🔹 Yalinelena Church 12 Tribes Membership
🛡 By joining the "Tribe of Judah," you will stand as a worshiper and warrior anointed by God, participating in all spiritual activities connected to the Tribe of Judah.

💠 Will you step into the blessing and mission of the "Tribe of Judah"? 💠`
  },
  
  2: { // Reuben
    badge: '🌊🔴',
    fullDescription: `📖 Scriptural Foundation

🔹 Genesis 49:3–4 (Jacob's blessing and warning to Reuben)
"Reuben, you are my firstborn, my might, the first sign of my strength, excelling in honor, excelling in power. But you are as turbulent as water, you will no longer excel. For you went up onto your father's bed, onto my couch and defiled it."

🔹 Deuteronomy 33:6 (Moses' blessing to the Tribe of Reuben)
"Let Reuben live and not die, nor his people be few."

💠 The Hebrew Meaning of Reuben

Reuben (רְאוּבֵן, Re'uven) means "See, a son!"

The name comes from Genesis 29:32: when Leah gave birth to Reuben, she said, "The Lord has seen my misery. Surely my husband will love me now."

Reuben symbolizes God's watchful care and favor, deeply tied to spiritual identity and grace.

🌊 Spiritual Significance of the Tribe of Reuben

1️⃣ The Honor and Responsibility of the Firstborn
📖 Numbers 1:20–21: "The descendants of Reuben, Israel's firstborn, according to their clans and families—every male twenty years old or more who could serve in the army—numbered 46,500."
👉 As the firstborn, Reuben was meant to carry spiritual leadership. But because of failure, he lost his position. This reminds us that God's grace and entrusted responsibility must be handled with care.

2️⃣ "Turbulent as Water" – A Spiritual Trait
📖 Genesis 49:4: "Unstable as water, you will not excel."
👉 Reuben's nature is like water—restless and unstable. This points to impulsiveness and lack of self-control, yet also symbolizes adaptability and the possibility of restoration by grace.

3️⃣ God's Mercy and Restoration
📖 Deuteronomy 33:6: "Let Reuben live and not die."
👉 Moses' blessing shows that even though Reuben lost his firstborn rights, God still had mercy, allowing him to live and continue in His plan. This is a reminder that God's grace never ends and He restores those who turn back to Him.

🌟 Blessings of the Tribe of Reuben

✅ Grace of Restoration: Despite past failures, God willed for Reuben's tribe to live on—showing His mercy and restorative power.
✅ Spiritual Adaptability: Being compared to "water" reflects the tribe's ability to adapt and grow, and under God's guidance, to be transformed into a blessing.
✅ God's Care and Identity: The name "Reuben" means "See, a son!"—a reminder that we are God's children, always under His watchful care.

🔥 Spiritual Application: Mission of the Tribe of Reuben

🛡 If you choose to join the "Tribe of Reuben," your life will carry the mission of:
✔ Living out your identity as a child of God, experiencing His care and restoration.
✔ Learning to govern your life, not being swayed by the "restlessness of water," but becoming a strong and steadfast vessel.
✔ Sharing God's grace, helping the fallen rise again, and walking into spiritual restoration.

🔹 Yalinelena Church 12 Tribes Membership
💠 If you decide to join the "Tribe of Reuben," you will stand as a representative of restoration and God's mercy, and take part in all the spiritual activities of the Tribe of Reuben.

📖 Will you embrace the blessing and mission of the Tribe of Reuben? 💠`
  },

  3: { // Gad
    badge: '🛡️',
    fullDescription: `📖 Scriptural Foundation

1️⃣ Warrior Spirit: Fighting for God's Kingdom
📖 1 Chronicles 12:8 – "From the tribe of Gad, brave warriors joined David's army. They were trained for battle and could handle the shield and spear; their faces were like the faces of lions, and they were as swift as gazelles on the mountains."
👉 The Tribe of Gad is called to be "warriors of God's Kingdom", boldly facing spiritual battles without retreat.

2️⃣ Spiritual Steadfastness and Loyalty
📖 Numbers 32:16–18 – "Then they came up to him and said, 'We would like to build pens here for our livestock and cities for our women and children. But we will arm ourselves for battle and go ahead of the Israelites until we have brought them to their place.'"
👉 Though the Tribe of Gad chose to settle east of the Jordan, they still stood by their brothers to fight. This demonstrates loyalty and responsibility in the spiritual family.

3️⃣ Blessing of Victory and Expansion
📖 Deuteronomy 33:20 – "Blessed is he who enlarges Gad's domain!"
👉 God gave the Tribe of Gad an anointing of expansion—not only to win victories but to enlarge their territory and influence.

🌟 Blessings of the Tribe of Gad

✅ Strength and courage, unafraid of spiritual battles
✅ Loyalty to God's Kingdom, faithfully fighting alongside their brothers
✅ Victory and expansion, becoming both defenders and pioneers of God's Kingdom

🔥 Spiritual Application: Mission of the Tribe of Gad

🛡 If you choose to join the "Tribe of Gad," your life will carry the mission of:
✔ Becoming a spiritual warrior of God's Kingdom, resisting the attacks of the enemy
✔ Standing firm in faith, refusing to compromise or retreat
✔ Helping brothers and sisters grow, winning together in God's Kingdom

🔹 Yalinelena Church 12 Tribes Membership
💠 If you decide to join the "Tribe of Gad," you will take your place as a warrior of God's Kingdom, engaging in Gad's prayers, missions, and spiritual warfare training, and playing a key role in the expansion of God's Kingdom.

📖 Will you embrace the blessing and mission of the Tribe of Gad? 💠`
  },

  4: { // Asher
    badge: '🌿💎',
    fullDescription: `📖 Scriptural Foundation

🔹 Genesis 49:20 (Jacob's blessing over Asher)
"Asher's food will be rich; he will provide delicacies fit for a king."

🔹 Deuteronomy 33:24–25 (Moses' blessing over Asher)
"Most blessed of sons is Asher; let him be favored by his brothers, and let him dip his foot in oil. Your gates shall be iron and bronze, and as your days, so shall your strength be."

💠 Hebrew Meaning of Asher
• Asher (אָשֵׁר, Asher) means "happy, blessed, fortunate."
• When Leah's maid Zilpah bore Asher to Jacob, Leah declared, "How happy I am! The women will call me blessed!" (Genesis 30:13).
• The Tribe of Asher symbolizes abundance, prosperity, joy, and joyful service.

🌿 Spiritual Significance of the Tribe of Asher

1️⃣ Blessing of Abundance and Prosperity
📖 Genesis 49:20 – "Asher's food will be rich; he will provide delicacies fit for a king."
👉 The Tribe of Asher was entrusted with abundant inheritance, representing both spiritual and material fullness, making them vessels of blessing to others.

2️⃣ A Life Marked by Joy and Favor
📖 Deuteronomy 33:24 – "Most blessed of sons is Asher; let him be favored by his brothers."
👉 The people of Asher are chosen to be a joy-filled people, carrying God's favor and spreading His joy wherever they go.

3️⃣ Strong Protection and Secure Living
📖 Deuteronomy 33:25 – "Your gates shall be iron and bronze; and as your days, so shall your strength be."
👉 Though richly blessed, Asher was also granted strong protection, symbolizing spiritual security, stability, and steadfast faith given by God.

🌟 Blessings of the Tribe of Asher

✅ God's abundant provision—lacking nothing and becoming a blessing to others
✅ A joyful spirit that reflects and testifies to God's goodness
✅ Strength and protection from God, resulting in spiritual stability and resilience

🔥 Spiritual Application: Mission of the Tribe of Asher

🛡 If you choose to join the "Tribe of Asher," your life will carry the mission of:
✔ Growing in God's blessings and becoming a channel through which abundance flows to those in need
✔ Living out the joy God gives, influencing others and revealing the glory of His Kingdom
✔ Standing strong in faith, relying on God's promises, and living a life marked by stability and strength

🔹 Yalinelena Church – 12 Tribes Membership
💠 If you decide to join the "Tribe of Asher," you will become a carrier of God's blessings, participating in Asher's spiritual activities, joyful service, and ministries of provision.

📖 Will you step into the blessing and mission of the Tribe of Asher? 💠`
  },

  5: { // Naphtali
    badge: '🦌💙',
    fullDescription: `📖 Scriptural Foundation

🔹 Genesis 49:21 (Jacob's blessing over Naphtali)
"Naphtali is a doe set free that bears beautiful words."

🔹 Deuteronomy 33:23 (Moses' blessing over Naphtali)
"O Naphtali, satisfied with favor and full of the blessing of the Lord, possess the west and the south."

💠 Hebrew Meaning of Naphtali
• Naphtali (נַפְתָּלִי, Naphtali) means "my struggle," "my wrestling," or "my battle."
• The name originates from Genesis 30:8, when Rachel said, "I have wrestled greatly with my sister, and I have prevailed," after her maid Bilhah bore Naphtali to Jacob.
• The Tribe of Naphtali symbolizes freedom, swift movement, spiritual joy, and overflowing grace, representing breakthrough and victory.

🦌 Spiritual Significance of the Tribe of Naphtali

1️⃣ Running Freely and Living in God-Given Freedom
📖 Genesis 49:21 – "Naphtali is a doe set free that bears beautiful words."
👉 This tribe represents complete freedom in God, able to run unhindered, marked by spiritual sensitivity and agility.

2️⃣ Filled with Grace, Becoming a Channel of Blessing
📖 Deuteronomy 33:23 – "Satisfied with favor and full of the blessing of the Lord."
👉 The people of Naphtali carry abundant grace, living lives that are filled with God's blessing and flowing outward to others.

3️⃣ Speaking Beautiful Words that Bring Healing and Comfort
📖 Proverbs 25:11 – "A word fitly spoken is like apples of gold in settings of silver."
👉 One of Naphtali's key gifts is the gift of speech—the ability to speak life-giving, encouraging words that bring healing and restoration.

🌟 Blessings of the Tribe of Naphtali

✅ Spiritual freedom—unbound and able to run toward God's calling
✅ A life filled with God's grace, becoming a vessel of blessing to others
✅ The gift of beautiful words, speaking encouragement and comfort as a spiritual encourager

🔥 Spiritual Application: Mission of the Tribe of Naphtali

🛡 If you choose to join the "Tribe of Naphtali," your life will carry the mission of:
✔ Learning to live in the freedom God gives, no longer bound by the world's restraints
✔ Becoming a person full of grace and willing to share that grace, allowing blessings to flow in God's Kingdom
✔ Blessing others through words, serving as a spiritual intercessor who brings healing and comfort

🔹 Yalinelena Church – 12 Tribes Membership
💠 If you decide to join the "Tribe of Naphtali," you will become a witness of freedom and grace, participating in Naphtali's spiritual activities and ministries that proclaim God's Word and blessings.

📖 Will you step into the blessing and mission of the Tribe of Naphtali? 💠`
  },

  6: { // Manasseh
    badge: '🦬💜',
    fullDescription: `📖 Scriptural Foundation

🔹 Genesis 41:51 (Origin of the name Manasseh)
"Joseph named his firstborn Manasseh and said, 'It is because God has made me forget all my trouble and all my father's household.'"

🔹 Genesis 48:19 (Jacob's prophecy over Manasseh)
"But his younger brother will be greater than he, and his descendants will become a group of nations."

🔹 Deuteronomy 33:17 (Moses' blessing over Joseph, including Manasseh and Ephraim)
"In majesty he is like a firstborn bull; his horns are the horns of a wild ox. With them he will gore the nations, even those at the ends of the earth. Such are the ten thousands of Ephraim; such are the thousands of Manasseh."

💠 Hebrew Meaning of Manasseh
• Manasseh (מְנַשֶּׁה, Menashsheh) means "to cause to forget" or "to make one forget."
• The name reflects God's healing of past pain, granting freedom from former affliction and sorrow.
• Though Manasseh was placed after Ephraim in Jacob's blessing, he still became a strong and influential tribe—symbolizing God's restoration and enduring grace.

🦬 Spiritual Significance of the Tribe of Manasseh

1️⃣ A Testimony of Healing and Victory Over Past Affliction
📖 Genesis 41:51 – "God has made me forget all my trouble."
👉 Manasseh represents healing and restoration, revealing God's power to redeem the past and grant new beginnings.

2️⃣ Humility and Submission in Receiving God's Blessing
📖 Genesis 48:19 – "His younger brother will be greater than he."
👉 Though Ephraim received the greater blessing, Manasseh remained preserved by God and became an essential part of His plan—symbolizing humility, obedience, and grace received without resentment.

3️⃣ Strength Like a Bull, Influencing the Nations
📖 Deuteronomy 33:17 – "His majesty is like a firstborn bull."
👉 The Tribe of Manasseh reflects spiritual strength and influence, called to be a vessel through which God advances His purposes to the nations.

🌟 Blessings of the Tribe of Manasseh

✅ Healing from past affliction, stepping into renewed grace and restoration
✅ Humble obedience, standing firm within God's divine plan
✅ Strength like a mighty bull, exercising influence as a blessing to the nations

🔥 Spiritual Application: Mission of the Tribe of Manasseh

🛡 If you choose to join the "Tribe of Manasseh," your life will carry the mission of:
✔ Receiving God's healing from past wounds and walking into restoration and grace
✔ Learning humility and obedience, standing securely within God's purposes
✔ Growing strong and courageous—like a bull—becoming a spiritual catalyst who impacts the world

🔹 Yalinelena Church – 12 Tribes Membership
💠 If you decide to join the "Tribe of Manasseh," you will become a witness of God's healing and restoration, participating in Manasseh's spiritual ministries and carrying God's grace to many.

📖 Will you step into the blessing and mission of the Tribe of Manasseh? 💠`
  },

  7: { // Simeon
    badge: '⚔️🔴',
    fullDescription: `📖 Scriptural Foundation

🔹 Genesis 49:5–7 (Jacob's prophecy over Simeon)
"Simeon and Levi are brothers—
their swords are weapons of violence.
Let my soul not enter their council;
let my honor not be united with their assembly.
For in their anger they killed men,
and in their self-will they hamstrung oxen.
Cursed be their anger, for it is fierce,
and their wrath, for it is cruel!
I will scatter them in Jacob
and disperse them in Israel."

🔹 Deuteronomy 33 (Simeon is not mentioned individually in Moses' blessing, indicating a diminished prominence)

🔹 Joshua 19:1 (The territory of the Tribe of Simeon)
"The second lot came out for the tribe of Simeon, according to their clans. Their inheritance lay within the territory of Judah."

💠 Hebrew Meaning of Simeon
• Simeon (שִׁמְעוֹן, Shim'on) comes from the Hebrew root שָׁמַע (shema), meaning "to hear" or "to listen."
• The name signifies that God hears the cries of His people, but it also carries the call for people to listen and obey God's word.
• However, Simeon's lineage was marked by intense anger and vengeance, which led to the tribe's decline and eventual dispersion within the territory of Judah.

⚔️ Spiritual Significance of the Tribe of Simeon

1️⃣ A Warning Against Anger and Revenge
📖 Genesis 49:7 – "Cursed be their anger, for it is fierce, and their wrath, for it is cruel."
👉 Simeon's ancestors took revenge for the defilement of their sister Dinah by slaughtering all the men of Shechem (Genesis 34:25–26). This violent act brought Jacob's strong warning upon their descendants.

2️⃣ Scattered Within Judah: Learning Submission and Obedience
📖 Joshua 19:1 – "Their inheritance lay within the territory of Judah."
👉 The Tribe of Simeon did not receive an independent territory but was absorbed into Judah's land. This reflects a call to learn submission, restraint, and walking with God, rather than acting out of human impulse.

3️⃣ Transformation into Worshipers: From Violence to Listening and Obedience
📖 Deuteronomy 6:4 – "Hear (Shema), O Israel: The Lord our God, the Lord is one."
👉 Since the name "Simeon" means to hear, this tribe carries a redemptive call—to be transformed from flesh-driven conflict into true worshipers who listen to and obey God's word.

🌟 Blessings of the Tribe of Simeon

✅ Learning to turn from fleshly impulses to a Spirit-led life under God's guidance
✅ Entering the grace of listening to God's word, growing in obedience and worship
✅ Walking in unity with the Tribe of Judah, becoming spiritual warriors who prevail through prayer and praise

🔥 Spiritual Application: Mission of the Tribe of Simeon

🛡 If you choose to join the "Tribe of Simeon," your life will carry the mission of:
✔ Submitting to God and allowing Him to transform anger and passion into spiritual strength
✔ Learning to listen to God's voice, acting not by human impulse but by divine wisdom
✔ Becoming a worshiper and intercessor in God's Kingdom, walking daily with Him

🔹 Yalinelena Church – 12 Tribes Membership
💠 If you decide to join the "Tribe of Simeon," you will become a vessel trained in obedience and attentive listening to God's word, participating in Simeon's spiritual formation and worship ministries.

📖 Will you step into the blessing and mission of the Tribe of Simeon? 💠`
  },

  8: { // Levi
    badge: '🛡️👑',
    fullDescription: `📖 Scriptural Foundation

🔹 Genesis 49:5–7 (Jacob's prophecy over Levi)
"Simeon and Levi are brothers—
their swords are weapons of violence.
Let my soul not enter their council;
let my honor not be united with their assembly.
For in their anger they killed men,
and in their self-will they hamstrung oxen.
Cursed be their anger, for it is fierce,
and their wrath, for it is cruel!
I will scatter them in Jacob
and disperse them in Israel."

🔹 Deuteronomy 33:8–11 (Moses' blessing over the Tribe of Levi)
"About Levi he said:
Your Thummim and Urim belong to your faithful servant,
whom you tested at Massah
and with whom you contended at the waters of Meribah.
He said of his father and mother, 'I have no regard for them';
he did not recognize his brothers
or acknowledge his own children,
but he watched over your word
and guarded your covenant.
He teaches your precepts to Jacob
and your law to Israel.
He offers incense before you
and whole burnt offerings on your altar.
Bless all his skills, Lord,
and be pleased with the work of his hands."

🔹 Numbers 3:6–10 (God's calling of the Tribe of Levi)
"Bring the tribe of Levi and present them to Aaron the priest to assist him. They are to perform duties for him and for the whole community at the Tent of Meeting by doing the work of the tabernacle."

💠 Hebrew Meaning of Levi
• Levi (לֵוִי, Levi) comes from the Hebrew root לָוָה (lavah), meaning "to join," "to be united," or "to accompany."
• This reflects Levi's calling to stand between God and His people, serving as priests and ministers.
• Though the tribe was initially rebuked by Jacob for violent anger, their later faithfulness and zeal for God led them to be chosen as Israel's priestly tribe, entrusted with temple worship and the teaching of the Law.

🛡️ Spiritual Significance of the Tribe of Levi

1️⃣ Chosen Priests and Spiritual Servants of God
📖 Numbers 3:6–7 – "Bring the tribe of Levi… to assist Aaron."
👉 The Tribe of Levi was chosen to serve God directly, becoming priests and worship leaders for all Israel.

2️⃣ Holiness and Consecration: Set Apart for God Alone
📖 Deuteronomy 10:8 – "At that time the Lord set apart the tribe of Levi to carry the ark of the covenant of the Lord, to stand before the Lord to minister and to pronounce blessings in His name."
👉 The Levites were not given land as an inheritance; the Lord Himself was their portion, symbolizing complete devotion and dependence on God.

3️⃣ Worshipers and Intercessors Standing Between God and the People
📖 1 Chronicles 16:4 – "David appointed some of the Levites to minister before the ark of the Lord, to make petition, to give thanks, and to praise the Lord, the God of Israel."
👉 The Levites led worship, taught the Law, and interceded—serving as a bridge between God and His people.

Levi in the New Testament Perspective

In the New Testament, Jesus Christ is the only Mediator (1 Timothy 2:5) and our Great High Priest (Hebrews 4:14–16). Through His redemption, every believer is invited into the priestly calling, becoming a "royal priesthood" (1 Peter 2:9) with direct access to God.

Therefore, the modern understanding of the Tribe of Levi is no longer an exclusive priestly class, but rather a calling of those specially devoted to worship, prayer, and service, whose mission is to help all believers live out their identity as royal priests and draw closer to God.

🔥 The Spiritual Mission of the Modern Tribe of Levi

✅ No longer a separate Old Testament priestly class, but servants who help the whole church live as a royal priesthood (1 Peter 2:9)
✅ Devoted to worship and prayer, leading the church into God's presence (1 Chronicles 16:4)
✅ Teaching and transmitting God's Word, equipping believers to understand His statutes and ways (Deuteronomy 33:10)
✅ Serving as spiritual mentors and ministers within the church—supporting pastoral care, counseling, and the building of God's house

📖 Hebrews 4:16 –
"Let us then approach God's throne of grace with confidence, so that we may receive mercy and find grace to help us in our time of need."
👉 Today, every Christian can come directly before God, because all are priests under the New Covenant.

🛡 If you choose to join the Tribe of Levi, your calling is to:

✔ Devote yourself to worship and prayer, allowing God's presence to fill the church
✔ Help believers live out their identity as royal priests, walking closely with God
✔ Faithfully teach and share God's Word, equipping the church to grow strong in faith

🔹 Yalinelena Church – 12 Tribes Membership
💠 If you decide to join the "Tribe of Levi," you will become a leader in worship and service, helping guide the church into deeper spiritual life and intimacy with God.

📖 Will you step into the blessing and mission of the Tribe of Levi? 💠`
  },

  9: { // Issachar
    badge: '📜🌞',
    fullDescription: `📖 Scriptural Foundation

🔹 Genesis 49:14–15 (Jacob's blessing over Issachar)
"Issachar is a strong donkey,
lying down among the sheepfolds.
When he saw that a resting place was good
and that the land was pleasant,
he bowed his shoulder to bear burdens
and became a servant at forced labor."

🔹 Deuteronomy 33:18–19 (Moses' blessing over Issachar)
"About Zebulun he said, 'Rejoice, Zebulun, in your going out,'
and about Issachar, 'Rejoice, Issachar, in your tents.
They will summon peoples to the mountain
and there offer sacrifices of righteousness;
they will feast on the abundance of the seas,
on the treasures hidden in the sand.'"

🔹 1 Chronicles 12:32 (The spiritual insight of the Tribe of Issachar)
"From the tribe of Issachar, men who understood the times and knew what Israel should do—200 chiefs, with all their relatives under their command."

💠 Hebrew Meaning of Issachar
• Issachar (יִשָּׂשכָר, Yissachar) means "reward," "wages," or "recompense," symbolizing a spiritual inheritance gained through faithfulness.
• The Tribe of Issachar was known for wisdom, discernment, and devotion to learning, tasked with interpreting the Law and understanding the times. They were often regarded as God's strategists.

📜 Spiritual Significance of the Tribe of Issachar

1️⃣ Spiritual Wisdom and Discernment
📖 1 Chronicles 12:32 – "Men who understood the times and knew what Israel should do."
👉 The Tribe of Issachar possessed spiritual insight into the seasons, discerning God's plans and directions for each generation.

2️⃣ Delight in Learning and Studying God's Law
📖 Deuteronomy 33:18–19 – "Rejoice, Issachar, in your tents."
👉 Issachar devoted themselves to God's Word, transmitting wisdom and teaching the people how to walk in God's commandments.

3️⃣ Faithful Service and Willingness to Bear Responsibility
📖 Genesis 49:14–15 – "Issachar is a strong donkey."
👉 This imagery represents diligence, humility, and perseverance, showing a willingness to carry spiritual responsibility and labor for God's Kingdom.

🌟 Blessings of the Tribe of Issachar

✅ Receiving spiritual wisdom and understanding God's divine plans
✅ Strength in learning and teaching, helping God's people walk in truth
✅ Bearing spiritual responsibility, serving as strategists and guides in God's Kingdom

🔥 Spiritual Application: Mission of the Tribe of Issachar

🛡 If you choose to join the "Tribe of Issachar," your life will carry the mission of:
✔ Being deeply rooted in God's Word, becoming a wise teacher and counselor in His Kingdom
✔ Discerning God's timing and leading believers into His purposes
✔ Willingly carrying the weight of service, helping God's people grow spiritually

🔹 Yalinelena Church – 12 Tribes Membership
💠 If you decide to join the "Tribe of Issachar," you will become a spiritual strategist and teacher, helping the church understand God's plans and grow strong in His Word.

📖 Will you step into the blessing and mission of the Tribe of Issachar? 💠`
  },

  10: { // Zebulun
    badge: '⛵🌊',
    fullDescription: `📖 Scriptural Foundation

🔹 Genesis 49:13 (Jacob's blessing over Zebulun)
"Zebulun will live by the seashore
and become a haven for ships;
his border will extend toward Sidon."

🔹 Deuteronomy 33:18–19 (Moses' blessing over Zebulun)
"About Zebulun he said, 'Rejoice, Zebulun, in your going out,'
and about Issachar, 'Rejoice, Issachar, in your tents.
They will summon peoples to the mountain
and there offer sacrifices of righteousness;
they will feast on the abundance of the seas,
on the treasures hidden in the sand.'"

💠 Hebrew Meaning of Zebulun
• Zebulun (זְבוּלוּן, Zevulun) means "dwelling," "honor," or "a noble habitation."
• This name reflects a God-given inheritance connected with trade, international relations, wealth, and seafaring.
• The Tribe of Zebulun was blessed to become international merchants, providers, and stewards of resources, supplying what was needed for the advancement of God's Kingdom.

⛵ Spiritual Significance of the Tribe of Zebulun

1️⃣ Anointing for Maritime Trade and Global Expansion
📖 Genesis 49:13 – "Zebulun will live by the seashore and become a haven for ships."
👉 Settled near the sea, Zebulun became a hub of commerce, symbolizing spiritual pioneering, openness, and global influence.

2️⃣ A Calling as Providers and Stewards of Wealth
📖 Deuteronomy 33:19 – "They will feast on the abundance of the seas, on the treasures hidden in the sand."
👉 Zebulun was blessed to be a provider of resources, called to steward wealth wisely for the support and growth of God's Kingdom and its ministries.

3️⃣ A Mission of Missions and Cross-Cultural Engagement
📖 Isaiah 60:5 – "The wealth of the seas will be brought to you, to you the riches of the nations will come."
👉 Beyond commerce, Zebulun served as cultural connectors, building relationships among nations and carrying God's glory to all peoples.

🌟 Blessings of the Tribe of Zebulun

✅ Receiving an anointing for maritime activity and global outreach, impacting the nations
✅ Becoming providers and financial stewards who support the expansion of God's Kingdom
✅ Carrying a cross-cultural missionary calling, spreading God's glory among the nations

🔥 Spiritual Application: Mission of the Tribe of Zebulun

🛡 If you choose to join the "Tribe of Zebulun," your life will carry the mission of:
✔ Learning to steward God-given resources faithfully, becoming a channel of provision for His Kingdom
✔ Daring to pioneer and engage internationally, expanding God's Kingdom across cultures and fields
✔ Living as a Kingdom-minded entrepreneur, integrating vocation with divine mission to impact society

🔹 Yalinelena Church – 12 Tribes Membership
💠 If you decide to join the "Tribe of Zebulun," you will become a Kingdom expander and financial supporter, contributing to missions, cross-cultural outreach, and international advancement.

📖 Will you step into the blessing and mission of the Tribe of Zebulun? 💠`
  },

  11: { // Joseph
    badge: '🍇👑',
    fullDescription: `📖 Scriptural Foundation

🔹 Genesis 49:22–26 (Jacob's blessing over Joseph)
"Joseph is a fruitful vine,
a fruitful vine near a spring,
whose branches climb over a wall.
With bitterness archers attacked him;
they shot at him with hostility.
But his bow remained steady,
his strong arms stayed limber,
because of the hand of the Mighty One of Jacob,
because of the Shepherd, the Rock of Israel,
because of your father's God, who helps you,
because of the Almighty, who blesses you
with blessings of the heavens above,
blessings of the deep that lies below,
blessings of the breast and womb.
Your father's blessings are greater
than the blessings of the ancient mountains,
than the bounty of the everlasting hills.
Let all these rest on the head of Joseph,
on the brow of the one set apart from his brothers."

🔹 Deuteronomy 33:13–17 (Moses' blessing over Joseph)
"About Joseph he said:
'May the Lord bless his land
with the precious dew from heaven above
and with the deep waters that lie below;
with the best the sun brings forth
and the finest the moon can yield;
with the choicest gifts of the ancient mountains
and the fruitfulness of the everlasting hills;
with the best gifts of the earth and its fullness
and the favor of Him who dwelt in the burning bush.
Let all these rest on the head of Joseph,
on the brow of the prince among his brothers.
In majesty he is like a firstborn bull;
his horns are the horns of a wild ox.
With them he will gore the nations,
even those at the ends of the earth.
Such are the ten thousands of Ephraim,
such are the thousands of Manasseh.'"

💠 Hebrew Meaning of Joseph
• Joseph (יוֹסֵף, Yosef) means "God will add," "increase," or "multiply," derived from the Hebrew root יָסַף (yasaf), meaning to add.
• The Tribe of Joseph symbolizes prosperity, fruitfulness, wisdom, and divine protection, representing breakthrough and miraculous grace.
• Joseph's descendants formed two tribes—Ephraim and Manasseh—which became among the strongest and most influential tribes of Israel.

🍇 Spiritual Significance of the Tribe of Joseph

1️⃣ Anointing of Fruitfulness and Blessing
📖 Genesis 49:22 – "Joseph is a fruitful vine near a spring."
👉 The Tribe of Joseph is called to be a channel of blessing, carrying God's provision to many and producing abundant fruit.

2️⃣ Strength and Victory Through Suffering
📖 Genesis 49:23–24 – "Archers attacked him… but his bow remained steady."
👉 Joseph's life was marked by hardship and trials, yet through unwavering faith, God strengthened him, brought him to prosperity, and raised him as a ruler.

3️⃣ Authority and Influence: A Blessing to Nations
📖 Deuteronomy 33:17 – "In majesty he is like a firstborn bull."
👉 The Tribe of Joseph carries an anointing for leadership, governance, and expansion, called to steward influence and open new territories for God's Kingdom.

🌟 Blessings of the Tribe of Joseph

✅ Receiving God's multiplying grace—prospering and bearing much fruit in all things
✅ Standing strong in trials, overcoming adversity, and gaining honor through faith
✅ Walking in authority and influence, becoming leaders who bring transformation

🔥 Spiritual Application: Mission of the Tribe of Joseph

🛡 If you choose to join the "Tribe of Joseph," your life will carry the mission of:
✔ Becoming a channel of blessing—prospering in all things and leading God's people into abundance
✔ Standing firm in trials, overcoming by faith, and living out spiritual influence
✔ Serving as a steward and leader in God's Kingdom—bringing transformation to industries, enterprises, and society under God's rule

🔹 Yalinelena Church – 12 Tribes Membership
💠 If you decide to join the "Tribe of Joseph," you will become a vessel of prosperity and governance, receiving God's blessing in finance, leadership, enterprise, and spiritual influence—and carrying that blessing to the world.

📖 Will you step into the blessing and mission of the Tribe of Joseph? 💠`
  },

  12: { // Benjamin
    badge: '🐺🔥',
    fullDescription: `📖 Scriptural Foundation

🔹 Genesis 49:27 (Jacob's blessing over Benjamin)
"Benjamin is a ravenous wolf;
in the morning he devours the prey,
and in the evening he divides the plunder."

🔹 Deuteronomy 33:12 (Moses' blessing over Benjamin)
"Let the beloved of the Lord rest secure in Him,
for He shields him all day long,
and the one the Lord loves rests between His shoulders."

💠 Hebrew Meaning of Benjamin
• Benjamin (בִּנְיָמִין, Binyamin) means "son of the right hand" or "favored son," derived from ben (son) and yamin (right hand, honor, strength).
• As Jacob's youngest son, Benjamin represents a people especially protected by God, while also symbolizing strength, warfare, and spiritual courage.

🐺 Spiritual Significance of the Tribe of Benjamin

1️⃣ Strength Like a Wolf: Courage in Battle
📖 Genesis 49:27 – "Benjamin is a ravenous wolf."
👉 The Tribe of Benjamin is portrayed as a wolf—bold, fierce, and fearless—standing firm and prevailing in spiritual warfare.

2️⃣ Beloved of the Lord: Dwelling Under Divine Protection
📖 Deuteronomy 33:12 – "The beloved of the Lord will live in safety."
👉 Benjamin is uniquely cherished by God, living securely under His constant covering and protection.

3️⃣ Raising Mighty Warriors and Leaders
📖 Judges 20:16 – "Among all these soldiers there were seven hundred select troops who were left-handed, each of whom could sling a stone at a hair and not miss."
👉 The Tribe of Benjamin was known for elite left-handed warriors, marked by precision, strength, and excellence—symbolizing God's finely trained troops in spiritual battles.

🌟 Blessings of the Tribe of Benjamin

✅ Courage and strength—fearless like a wolf, victorious in spiritual warfare
✅ God's special love and protection, dwelling securely in His presence
✅ The raising of elite warriors, leaders, and champions for God's Kingdom

🔥 Spiritual Application: Mission of the Tribe of Benjamin

🛡 If you choose to join the "Tribe of Benjamin," your life will carry the mission of:
✔ Standing strong in spiritual warfare, fearless in the face of opposition, and victorious by faith
✔ Relying on God's protection, advancing boldly under His covering
✔ Becoming a warrior for God's Kingdom—proclaiming the gospel and leading others into God's victory

🔹 Yalinelena Church – 12 Tribes Membership
💠 If you decide to join the "Tribe of Benjamin," you will become an elite spiritual warrior, standing firm, fighting bravely, and leading others to experience God's protection and triumph.

📖 Will you step into the blessing and mission of the Tribe of Benjamin? 💠`
  }
};

const Step5_TribeInfo = ({ formData, updateFormData, nextStep, prevStep }) => {
  // --- 狀態管理 ---
  const [tribes, setTribes] = useState([]); 
  const [isLoading, setIsLoading] = useState(true); 
  const [error, setError] = useState(null); 
  const [selectedTribe, setSelectedTribe] = useState(null); 
  const [showDetail, setShowDetail] = useState(false); 

  // --- 數據獲取與整合 ---
  useEffect(() => {
    const localTribesData = [
      { id: 1, name: 'Judah', icon: judahIcon, color: '#D4AF37' },
      { id: 2, name: 'Reuben', icon: reubenIcon, color: '#C85A54' },
      { id: 3, name: 'Gad', icon: gadIcon, color: '#6B8E23' },
      { id: 4, name: 'Asher', icon: asherIcon, color: '#8FBC8F' },
      { id: 5, name: 'Naphtali', icon: naphtaliIcon, color: '#5F9EA0' },
      { id: 6, name: 'Manasseh', icon: manassehIcon, color: '#4682B4' },
      { id: 7, name: 'Simeon', icon: simeonIcon, color: '#708090' },
      { id: 8, name: 'Levi', icon: leviIcon, color: '#4169E1' },
      { id: 9, name: 'Issachar', icon: issacharIcon, color: '#6495ED' },
      { id: 10, name: 'Zebulun', icon: zebulunIcon, color: '#87CEEB' },
      { id: 11, name: 'Joseph', icon: josephIcon, color: '#DDA0DD' },
      { id: 12, name: 'Benjamin', icon: benjaminIcon, color: '#9370DB' },
    ];

    const fetchAndMergeTribes = async () => {
      try {
        const response = await fetch('https://pray-api.yalinelena.church/auth/profile/tribes');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const apiData = await response.json();
        console.log('--- API Response Received ---', apiData);

        const mergedTribes = localTribesData.map(localTribe => {
          const apiTribe = apiData.tribes.find(t => t.code === localTribe.id);
          const tribeDesc = tribeDescriptions[localTribe.id] || {};
          
          return {
            ...localTribe,
            details: apiTribe ? apiTribe.label : 'Description not available.',
            badge: tribeDesc.badge || '',
            fullDescription: tribeDesc.fullDescription || 'Full description coming soon...'
          };
        });
        
        console.log('--- Merged Tribe Data for UI ---', mergedTribes);
        setTribes(mergedTribes);
      } catch (e) {
        console.error("Failed to fetch or merge tribes data:", e);
        setError("Could not load tribe information. Please try again later.");
        setTribes(localTribesData.map(t => ({ 
          ...t, 
          details: 'Failed to load details.',
          fullDescription: 'Failed to load full description.'
        })));
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndMergeTribes();
  }, []);

  // --- 事件處理函式 ---
  const handleTribeClick = (tribe) => {
    console.log('--- Tribe Clicked ---', tribe);
    setSelectedTribe(tribe);
    setShowDetail(true);
  };

  const handleBackToList = () => {
    setShowDetail(false);
    setSelectedTribe(null);
  };

  const handleImageError = (e) => {
    console.error('Không load được ảnh:', e.target.src);
    e.target.style.display = 'none';
  };

  // --- 渲染邏輯 ---
  if (isLoading) {
    return <div className="loading-container">Loading Spiritual Tribes...</div>;
  }

  if (error) {
    return <div className="error-container">Error: {error}</div>;
  }

  return (
    <div className="tribe-info-container">
      {!showDetail ? (
        // --- 支派列表視圖 ---
        <>
          <div className="tribe-info-header">
            <button className="back-btn" onClick={prevStep}>
              ←
            </button>
            <div className="tribe-title-section">
              <span className="choose-text">CHOOSE YOUR</span>
              <div className="center-icon-round">
                <img 
                  src={prayLogo} 
                  alt="Pray"
                  onError={handleImageError}
                />
              </div>
              <span className="spiritual-text">SPIRITUAL TRIBE</span>
            </div>
          </div>

          <div className="tribes-info-grid">
            {tribes.map((tribe) => (
              <div
                key={tribe.id}
                className="tribe-item"
                onClick={() => handleTribeClick(tribe)}
              >
                <div className="tribe-coin" style={{ backgroundColor: tribe.color }}>
                  <img 
                    src={tribe.icon} 
                    alt={tribe.name}
                    onError={handleImageError}
                  />
                </div>
                <span className="tribe-label">{tribe.name}</span>
              </div>
            ))}
          </div>

          <div className="tribe-info-buttons">
            <button className="continue-btn" onClick={nextStep}>
              CONTINUE
            </button>
          </div>
        </>
      ) : (
        // --- 支派詳情視圖 ---
        <div className="tribe-detail-view">
          <div className="tribe-detail-header">
            <button className="back-btn" onClick={handleBackToList}>
              ←
            </button>
          </div>

          <div className="tribe-detail-content">
            {/* 上半部：圖示與名稱 */}
            <div className="tribe-detail-header-row">
              <div className="tribe-detail-icon" style={{ backgroundColor: selectedTribe.color }}>
                <img 
                  src={selectedTribe.icon} 
                  alt={selectedTribe.name}
                  onError={handleImageError}
                />
              </div>
              <h2 className="tribe-detail-name">
                {selectedTribe.name} {selectedTribe.badge}
              </h2>
            </div>
            
            {/* ✅ SỬA: Hiển thị full description thay vì chỉ API label */}
            <div className="tribe-detail-info">
              <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                {selectedTribe.fullDescription}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Step5_TribeInfo;
