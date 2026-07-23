import mongoose from "mongoose";
import dotenv from "dotenv";
import { Hawala } from "../models/Hawala.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "..", ".env") });

async function run() {
  try {
    console.log("Connecting to database...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected!");

    // Check if these already exist to prevent duplicates
    const ids = ["SHW-9001", "SHW-9002", "SHW-9003", "SHW-9004", "SHW-9005"];
    await Hawala.deleteMany({ id: { $in: ids } });

    const newHawalas = [
      {
        id: "SHW-9001",
        type: "sent",
        date: new Date().toLocaleString(),
        senderBranch: "Kabul Branch",
        destinationBranch: "Herat Main",
        senderName: "Abdul Rahim",
        senderPhone: "0799887766",
        senderFather: "Abdul Samad",
        senderIdNum: "Tazkira-1122",
        receiverName: "Mohammad Qasim",
        receiverFather: "Mohammad Shah",
        receiverPhone: "0788334455",
        receiverExpectedId: "Tazkira-5566",
        amount: 3500,
        currency: "USD",
        fee: 25,
        status: "Sent - Pending Payout",
        fundingSource: "sarafi",
        createdAt: new Date()
      },
      {
        id: "SHW-9002",
        type: "sent",
        date: new Date().toLocaleString(),
        senderBranch: "Kabul Branch",
        destinationBranch: "Herat Main",
        senderName: "Farhad Amin",
        senderPhone: "0700554433",
        senderFather: "Aminullah",
        senderIdNum: "Tazkira-3344",
        receiverName: "Sayed Omar",
        receiverFather: "Sayed Akbar",
        receiverPhone: "0777221199",
        receiverExpectedId: "Tazkira-7788",
        amount: 150000,
        currency: "AFN",
        fee: 500,
        status: "Sent - Pending Payout",
        fundingSource: "sarafi",
        createdAt: new Date()
      },
      {
        id: "SHW-9003",
        type: "sent",
        date: new Date().toLocaleString(),
        senderBranch: "Kabul Branch",
        destinationBranch: "Herat Main",
        senderName: "Hikmatullah",
        senderPhone: "0766112233",
        senderFather: "Rahmatullah",
        senderIdNum: "Tazkira-8899",
        receiverName: "Naimat Khan",
        receiverFather: "Gul Khan",
        receiverPhone: "0755998877",
        receiverExpectedId: "Tazkira-9900",
        amount: 2000,
        currency: "EUR",
        fee: 20,
        status: "Sent - Pending Payout",
        fundingSource: "sarafi",
        createdAt: new Date()
      },
      {
        id: "SHW-9004",
        type: "sent",
        date: new Date().toLocaleString(),
        senderBranch: "Kabul Branch",
        destinationBranch: "Herat Main",
        senderName: "Zabiullah",
        senderPhone: "0744332211",
        senderFather: "Habibullah",
        senderIdNum: "Tazkira-4455",
        receiverName: "Ahmad Shah",
        receiverFather: "Wali Shah",
        receiverPhone: "0733887766",
        receiverExpectedId: "Tazkira-1234",
        amount: 250000,
        currency: "PKR",
        fee: 1000,
        status: "Sent - Pending Payout",
        fundingSource: "sarafi",
        createdAt: new Date()
      },
      {
        id: "SHW-9005",
        type: "sent",
        date: new Date().toLocaleString(),
        senderBranch: "Kabul Branch",
        destinationBranch: "Herat Main",
        senderName: "Mustafa Qazi",
        senderPhone: "0799443322",
        senderFather: "Qazi Selim",
        senderIdNum: "Tazkira-9988",
        receiverName: "Ehsanullah",
        receiverFather: "Sanaullah",
        receiverPhone: "0788665544",
        receiverExpectedId: "Tazkira-5678",
        amount: 5000,
        currency: "CNY",
        fee: 100,
        status: "Sent - Pending Payout",
        fundingSource: "sarafi",
        createdAt: new Date()
      }
    ];

    await Hawala.insertMany(newHawalas);
    console.log("Seeded 5 sent Hawalas to Herat Main branch successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Error seeding data:", err);
    process.exit(1);
  }
}

run();
