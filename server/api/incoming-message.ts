import { IncomingMessage, TwilioIncoming } from "~/types/types";
import twilio from "twilio";
import { createClient } from "@supabase/supabase-js";

export default defineEventHandler(async (event) => {
	const config = useRuntimeConfig();

	const supabase = createClient(
		config.public.SUPABASE_URL,
		config.private.SUPABASE_SERVICE_KEY
	);

	const accountSid = config.private.TWILIO_ACCOUNT_SID;
	const authToken = config.private.TWILIO_AUTH_TOKEN;

	const client = twilio(accountSid, authToken);

	const body: TwilioIncoming = await useBody(event);
	const { MessagingResponse } = twilio.twiml;

	const twiml = new MessagingResponse();

	twiml.message("Thank you for your reply!");

	const contactPhoneNumbers = ["+18134084221"];

	contactPhoneNumbers.forEach(async (number) => {
		let regex = /stop|no|harassment|fuck/gi;
		if (!body.Body.match(regex)) {
			const res = await client.messages.create({
				body: `New message from ${body.From} to ${body.To} with message: ${body.Body}`,
				from: config.private.TWILIO_PHONE_NUMBER,
				to: number,
			});
		}
	});

	let user_id = null;

	try {
		// getting user id from phone number
		const { data } = await supabase
			.from("profiles")
			.select("*")
			.contains("phoneNumbers", [body.To]);
		user_id = !!data[0] ? data[0].user_id : null;
	} catch (error) {
		console.log(error);
	}

	// will need to clean this up to use user_id's if making public app
	let leads = [];

	if (!!user_id) {
		try {
			const { data, error } = await supabase
				.from("leads")
				.select("*")
				.eq("user_id", user_id)
				.contains("wireless", [body.From]);

			if (error) {
				throw error;
			}
			leads = data.map((lead) => lead);
		} catch (error) {
			console.log(error);
		}
	}
	if (leads?.length > 1) {
		console.log("more than one lead found with that number");

		let counter = 0;

		leads.forEach(async (lead) => {
			const propertyAddress = !!lead.propertyAddress
				? lead.propertyAddress
				: { address1: "None Found", city: null, state: null, zip: null };
			let incoming_message: IncomingMessage = {
				user_id: !!user_id ? user_id : null,
				message: body.Body,
				from: body.From,
				to: body.To,
				sid: body.MessageSid + `-${counter}`,
				created_at: new Date().toISOString(),
				sent_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
				status: body.MessageStatus,
				direction: "inbound",
				errorCode: null,
				errorMessage: null,
				lead_id: lead.lead_id,
				propertyAddress: propertyAddress,
			};

			counter++;

			try {
				const { error } = await supabase
					.from("incoming_messages")
					.insert(incoming_message);
			} catch (error) {
				console.log(error);
			}
		});
	} else {
		const propertyAddress = !!leads[0]?.propertyAddress
			? leads[0].propertyAddress
			: { address1: "None Found", city: null, state: null, zip: null };
		let incoming_message: IncomingMessage = {
			user_id: !!user_id ? user_id : null,
			message: body.Body,
			from: body.From,
			to: body.To,
			sid: body.MessageSid,
			created_at: new Date().toISOString(),
			sent_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			status: body.MessageStatus,
			direction: "inbound",
			errorCode: null,
			errorMessage: null,
			lead_id: !!leads[0]?.lead_id ? leads[0].lead_id : null,
			propertyAddress: propertyAddress,
		};

		try {
			const { error } = await supabase
				.from("incoming_messages")
				.insert(incoming_message);

			if (error) {
				throw error;
			}
		} catch (error) {
			console.log(error);
		}
	}

	return;
});
