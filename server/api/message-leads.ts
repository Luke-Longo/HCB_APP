import twilio from "twilio";
import { createClient } from "@supabase/supabase-js";
import { Lead, Message, Filter } from "../../types/types";

export default defineEventHandler(async (event) => {
	const config = useRuntimeConfig();
	const accountSid = config.private.TWILIO_ACCOUNT_SID;
	const authToken = config.private.TWILIO_AUTH_TOKEN;

	const supabase = createClient(
		config.public.SUPABASE_URL,
		config.private.SUPABASE_SERVICE_KEY
	);

	const client = twilio(accountSid, authToken);

	const { message, leadProvider, leadType, otherProvider, otherType, user_id } =
		await useBody(event);

	console.log(message);

	let filters = [] as Filter[];

	if (leadProvider !== "all") {
		filters.push({
			field: "leadProvider",
			operator: "eq",
			value: !!otherProvider ? otherProvider : leadProvider,
		});
	}

	if (leadType !== "all") {
		filters.push({
			field: "leadType",
			operator: "eq",
			value: !!otherType ? otherType : leadType,
		});
	}
	let leads = [] as Lead[];

	let sentMessages = [] as Message[];

	let messageCounter = 0;

	let badNumberCounter = 0;

	let error;

	let range = 74;

	if (message === null) {
		error = new Error("Message is required");
		console.log(error);
		throw error;
	} else {
		try {
			if (filters.length === 1) {
				const { data, error } = await supabase
					.from("leads")
					.select("*")
					.eq("user_id", user_id)
					.eq("texted", false)
					.filter(filters[0].field, "eq", filters[0].value)
					.range(0, range);
				leads = data as Lead[];
				if (error) {
					throw error;
				}
			} else if (filters.length === 2) {
				const { data, error } = await supabase
					.from("leads")
					.select("*")
					.eq("user_id", user_id)
					.eq("texted", false)
					.filter(filters[0].field, "eq", filters[0].value)
					.filter(filters[1].field, "eq", filters[1].value)
					.range(0, range);
				console.log("two filters", data.length);
				leads = data as Lead[];
				if (error) {
					throw error;
				}
			} else if (filters.length === 0) {
				const { data, error } = await supabase
					.from("leads")
					.select("*")
					.eq("user_id", user_id)
					.eq("texted", false)
					.range(0, range);
				console.log("no filters", data.length);
				leads = data as Lead[];
				if (error) {
					throw error;
				}
			} else if (filters.length > 2) {
				error = new Error("Too many filters");
				console.log(error);
				throw error;
			}
		} catch (error) {
			console.log(error);
		}

		const badNumbers = [];

		try {
			const { data, error: badNumbersError } = await supabase
				.from("bad_numbers")
				.select("*")
				.eq("user_id", user_id);

			if (badNumbersError) {
				throw badNumbersError;
			}

			data.forEach((badNumber) => {
				badNumbers.push(badNumber.number);
			});
		} catch (error) {
			console.log(error);
		}

		leads.forEach(async (lead) => {
			if (lead.wireless.length > 0) {
				lead.wireless.forEach(async (phone) => {
					messageCounter++;
					if (!badNumbers.includes(phone)) {
						let twilioMessage;
						try {
							const res = await client.messages.create({
								body: message,
								from: config.private.TWILIO_PHONE_NUMBER,
								to: phone,
							});
							console.log(res);
							twilioMessage = res;
							if (!!res.errorMessage) {
								throw res.errorMessage;
							}
						} catch (error) {
							console.log(error);
						}

						let sentMessage: Message = {
							lead_id: lead.lead_id,
							user_id: user_id,
							message,
							to: phone,
							from: config.private.TWILIO_PHONE_NUMBER,
							sid: twilioMessage.sid,
							status: twilioMessage.status,
							created_at: twilioMessage.dateCreated,
							sent_at: !!twilioMessage.dateSent ? twilioMessage.dateSent : new Date(),
							updated_at: twilioMessage.dateUpdated,
							direction: twilioMessage.direction,
							errorCode: twilioMessage.errorCode,
							errorMessage: twilioMessage.errorMessage,
							propertyAddress: lead.propertyAddress,
						};

						sentMessages.push(sentMessage);

						try {
							const { error } = await supabase
								.from("leads")
								.update({ texted: true })
								.eq("lead_id", lead?.lead_id);
							const { error: err, data } = await supabase
								.from("sent_messages")
								.insert(sentMessage);
							await supabase
								.from("bad_numbers")
								.insert({ number: phone, user_id: user_id });
							if (error || err) {
								throw error || err;
							}
						} catch (error) {
							console.log(error);
						}
					} else {
						console.log("bad number");
						badNumberCounter++;
					}
				});
			} else {
				try {
					const { error } = await supabase
						.from("leads")
						.update({ texted: true })
						.eq("lead_id", lead?.lead_id);
					if (error) {
						throw error;
					}
				} catch (error) {
					console.log(error);
				}
				console.log("no phone numbers in lead");
			}
		});
		console.log(messageCounter);
		console.log(badNumberCounter);
		console.log(sentMessages);
	}

	return { messageCounter, badNumberCounter, sentMessages };
});