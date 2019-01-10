import inquirer from 'inquirer';
import consoleControl from 'console-control-strings';
import Gauge from 'gauge';
import { sprintf } from 'sprintf-js';
import uuid from 'uuid/v4';
import humanpass from 'humanpass';
import emailValidator from 'email-validator';
import 'cross-fetch/polyfill';
import {
	config as awsConfig,
	CognitoIdentityServiceProvider,
} from 'aws-sdk';
import {
	CognitoUserPool,
	CognitoUser,
	AuthenticationDetails,
} from 'amazon-cognito-identity-js';
import awsResources from '../../config/aws-resources.json';

awsConfig.update({ region: awsResources.region });

const cisp = new CognitoIdentityServiceProvider();
const gauge = new Gauge();

interface InquiredUserData {
	name: string;
	email: string;
	phone_number: string;
	password: string;
}

interface UserData extends InquiredUserData {
	username: string;
}

interface Confirmation {
	confirm: boolean;
}

const getUserData = async (): Promise<UserData> => {
	console.log(
		consoleControl.color('brightBlue', 'bold')
		+ 'Please provide the requested information for your new CMS user:'
		+ consoleControl.color('reset'),
	);

	const answers = await inquirer.prompt<InquiredUserData>([
		{
			type: 'input',
			name: 'name',
			message: 'Name (e.g., "Karen Eliot"):',
			validate: (name: string) => (!!name || 'Name must not be blank'),
		},
		{
			type: 'input',
			name: 'email',
			message: 'Email address (e.g., "karen@eli.ot"):',
			validate: (email: string) => (emailValidator.validate(email)
				|| 'Email address must be valid'),
		},
		{
			type: 'input',
			name: 'phone_number',
			message: 'SMS phone number in E.164 form (e.g., "+14045551234"):',
			validate: (phone: string) => (!!phone.match(/^\+[1-9]\d{1,14}$/)
				|| 'Phone number must be valid'),
		},
		{
			type: 'list',
			name: 'password',
			message: 'Select a password:',
			choices: humanpass.generatePasswords(30),
		},
	]);

	return {
		...answers,
		username: uuid(),
	};
};

const reviewUserData = (userData: UserData) => {
	let preConfirm = '\n'
		+ consoleControl.color('brightYellow', 'bold')
		+ 'Creating new Cognito user in pool '
		+ consoleControl.color('brightWhite', 'bold')
		+ awsResources.userPoolName
		+ consoleControl.color('brightWhite', 'stopBold')
		+ ` (${awsResources.userPoolId})`
		+ consoleControl.color('brightYellow', 'bold')
		+ ':'
		+ consoleControl.color('reset')
		+ '\n\n';

	Object.keys(userData).forEach((key) => {
		preConfirm += sprintf(
			'%s%20s%s: %s%s%s\n',
			consoleControl.color('brightWhite'),
			key,
			consoleControl.color('reset'),
			consoleControl.color('brightCyan'),
			userData[key as keyof UserData],
			consoleControl.color('reset')
		);
	});

	console.log(preConfirm);
};

const confirmCreate = async (userData: UserData): Promise<boolean> => {
	reviewUserData(userData);
	const answers = await inquirer.prompt<Confirmation>([
		{
			type: 'confirm',
			name: 'confirm',
			message: 'Create new user?',
			default: false,
		}
	]);
	return answers.confirm;
};

const createCognitoUser = (userData: UserData) => {
	const params = {
		MessageAction: 'SUPPRESS',
		TemporaryPassword: `${userData.password}_`,
		UserAttributes: [
			{
				Name: 'email',
				Value: userData.email,
			},
			{
				Name: 'email_verified',
				Value: 'true',
			},
			{
				Name: 'phone_number',
				Value: userData.phone_number,
			},
			{
				Name: 'phone_number_verified',
				Value: 'true',
			},
		],
		Username: userData.username,
		UserPoolId: awsResources.userPoolId,
	};

	gauge.show('Creating Cognito user', 0.0);
	gauge.pulse();

	return cisp.adminCreateUser(params)
		.promise();
};

const confirmCognitoUser = (userData: UserData) => {
	const userPool = new CognitoUserPool({
		UserPoolId: awsResources.userPoolId,
		ClientId: awsResources.appClientId,
	});

	let user = new CognitoUser({
		Username: userData.username,
		Pool: userPool,
	});

	let authDetails = new AuthenticationDetails({
		Username: userData.username,
		Password: `${userData.password}_`,
	});

	gauge.show('Confirming Cognito user', 0.5);

	return new Promise((resolve, reject) => {
		user.authenticateUser(authDetails, {
			onSuccess: () => {
				gauge.show('Confirmed Cognito user', 1.0);
				gauge.pulse();
				resolve();
			},
			onFailure: (error) => {
				gauge.hide();
				console.log(
					consoleControl.color('brightRed')
					+ 'Failed to confirm user with temporary password'
					+ consoleControl.color('reset'),
				);
				reject(error);
			},
			newPasswordRequired: function (userAttributes) {
				delete userAttributes.email_verified;
				delete userAttributes.phone_number_verified;
				userAttributes.name = userData.name;
				gauge.show('Completing password challenge', 0.75);
				gauge.pulse();
				user.completeNewPasswordChallenge(userData.password, userAttributes, this);
			},
		});
	});
};

const createUser = async () => {
	const userData = await getUserData();

	if (!(await confirmCreate(userData))) {
		console.log('Exiting without creating user');
		return;
	}

	await createCognitoUser(userData);
	await confirmCognitoUser(userData);

	gauge.hide();
	console.log(
		consoleControl.color('brightGreen')
		+ 'Successfully created new user!'
		+ consoleControl.color('reset'),
	);
};

createUser()
	.catch((error) => {
		console.log(
			consoleControl.color('brightRed')
			+ `Failed to create user: `
			+ consoleControl.color('reset')
			+ error,
		);
	});
