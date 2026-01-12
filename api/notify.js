import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE
  );

  const email = req.body.email_address;
  const item = req.body.item_name;

  const credits =
    item.includes("200") ? 200 :
    item.includes("100") ? 100 : 0;

  if (!credits) return res.status(400).send("Invalid item");

  const { data: user } = await supabase
    .from("profiles")
    .select("*")
    .eq("email", email)
    .single();

  await supabase.from("profiles")
    .update({ tokens: user.tokens + credits })
    .eq("id", user.id);

  res.status(200).send("OK");
}
