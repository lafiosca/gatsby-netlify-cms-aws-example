import inquirer from 'inquirer';
import consoleControl from 'console-control-strings';
import Gauge from 'gauge';
import { sprintf } from 'sprintf-js';
import uuid from 'uuid/v4';
import humanpass from 'humanpass';
import {
	config as awsConfig,
	CognitoIdentityServiceProvider,
} from 'aws-sdk';
import {
	CognitoUserPool,
	CognitoUser,
	AuthenticationDetails,
} from 'amazon-cognito-identity-js';
import config from '../config.json';

awsConfig.update({ region: config.region });

// const cisp = new CognitoIdentityServiceProvider();

// let gauge = new Gauge();

const selectPassword = async () => {
	const answers = await inquirer.prompt<{ password: string }>([
		{
			type: 'list',
			name: 'password',
			message: 'Select a password:',
			choices: humanpass.generatePasswords(30),
		},
	]);
	return answers.password;
};

// const confirmCreate = () => {
// 	return inquirer.prompt([
// 		{
// 			type: 'confirm',
// 			name: 'confirm',
// 			message: 'Create new user?',
// 			default: false,
// 		}
// 	])
// 		.then(answers => answers.confirm);
// };

// const createCognitoUser = userData => {
// 	const params = {
// 		MessageAction: 'SUPPRESS',
// 		TemporaryPassword: userData.password + '_',
// 		UserAttributes: [
// 			{
// 				Name: 'email',
// 				Value: userData.email,
// 			},
// 			{
// 				Name: 'email_verified',
// 				Value: 'true',
// 			},
// 			{
// 				Name: 'phone_number',
// 				Value: userData.phone_number,
// 			},
// 			{
// 				Name: 'phone_number_verified',
// 				Value: 'true',
// 			},
// 			{
// 			},
// 		],
// 		Username: userData.username,
// 		UserPoolId: config.userPoolId,
// 	};

// 	gauge.show('Creating Cognito user', 0.0);
// 	gauge.pulse();

// 	return cisp.adminCreateUser(params)
// 		.promise();
// };

// const confirmCognitoUser = userData => {
// 	const userPool = new CognitoUserPool({
// 		UserPoolId: config.userPoolId,
// 		ClientId: config.appClientId,
// 	});

// 	let user = new CognitoUser({
// 		Username: userData.username,
// 		Pool: userPool,
// 	});

// 	let authDetails = new AuthenticationDetails({
// 		Username: userData.username,
// 		Password: userData.password + '_',
// 	});

// 	gauge.show('Confirming Cognito user', 0.5);

// 	return new Promise((resolve, reject) => {
// 		user.authenticateUser(authDetails, {
// 			onSuccess: () => {
// 				gauge.show('Confirmed Cognito user', 1.0);
// 				gauge.pulse();
// 				resolve();
// 			},
// 			onFailure: error => {
// 				gauge.hide();
// 				console.error('Failed to authenticate:');
// 				console.error(error);
// 				reject(error);
// 			},
// 			newPasswordRequired: function (userAttributes) {
// 				delete userAttributes.email_verified;
// 				delete userAttributes.phone_number_verified;
// 				userAttributes.name = userData.name;
// 				gauge.show('Completing password challenge', 0.75);
// 				gauge.pulse();
// 				user.completeNewPasswordChallenge(userData.password, userAttributes, this);
// 			},
// 		});
// 	});
// };

const createUser = async () => {
	const username = uuid();
	const password = await selectPassword();

	const userData: { [key: string]: string } = {
		username,
		password,
		name: 'foo',
		email: 'foo@bar',
		phone_number: '123',
	};

	let preConfirm = '\n'
		+ consoleControl.color('brightYellow', 'bold')
		+ 'Creating new Cognito user in pool '
		+ consoleControl.color('brightWhite', 'bold')
		+ config.userPoolName
		+ consoleControl.color('brightWhite', 'stopBold')
		+ ` (${config.userPoolId})`
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
			userData[key],
			consoleControl.color('reset')
		);
	});

	console.log(preConfirm);

	// if (!(await confirmCreate())) {
	// 	console.log('Not creating user');
	// 	return;
	// }

	// await createCognitoUser(userData);
	// await upgradeCognitoUser(userData);
	// await confirmCognitoUser(userData);

	// gauge.hide();
	// console.log(consoleControl.color('brightGreen')
	// 	+ 'Successfully created new user'
	// 	+ consoleControl.color('reset')
	// );
};

// module.exports = {
// 	command: 'create',
// 	describe: 'Create a new user',
// 	builder: yargs => {
// 		yargs.option('u', {
// 			alias: 'preferred-username',
// 			describe: 'preferred username',
// 			demandOption: 'Please provide preferred username, e.g.: -u joe',
// 			type: 'string',
// 			coerce: arg => {
// 				if (!arg.match(/^\w*$/)) {
// 					throw new Error(`Username '${arg}' contains non-word characters`);
// 				}
// 				if (arg === '') {
// 					throw new Error('Please provide a non-empty preferred username');
// 				}
// 				return arg;
// 			},
// 		})
// 			.option('n', {
// 				alias: 'name',
// 				describe: 'name',
// 				demandOption: "Please provide user's real name, e.g.,: -n 'Joe Jackson'",
// 				type: 'string',
// 				coerce: arg => {
// 					if (arg === '') {
// 						throw new Error('Please provide a non-empty name');
// 					}
// 					return arg;
// 				},
// 			})
// 			.option('p', {
// 				alias: 'phone',
// 				describe: 'phone number',
// 				demandOption: 'Please provide phone number, e.g.: -p 4045551234',
// 				type: 'string',
// 				coerce: arg => {
// 					let matches = arg.match(/^(\+1)?\d{10}$/);
// 					if (!matches) {
// 						throw new Error(`Phone number '${arg}' does not match pattern /^(\\+1)?\\d{10}\$/`);
// 					}
// 					if (!matches[1]) {
// 						arg = `+1${arg}`;
// 					}
// 					return arg;
// 				},
// 			})
// 			.option('e', {
// 				alias: 'email',
// 				describe: 'email address',
// 				demandOption: 'Please provide email address, e.g.: -e foo@bar.com',
// 				type: 'string',
// 				coerce: arg => {
// 					if (!arg.match(/^[^@]+@[^@]+$/)) {
// 						throw new Error(`Invalid email address '${arg}'`);
// 					}
// 					return arg;
// 				},
// 			})
// 			.help()
// 			.strict()
// 			.check(argv => {
// 				if (argv._.length > 2) {
// 					throw new Error(`Unrecognized command: ${argv._[2]}`);
// 				}
// 				return true;
// 			});
// 	},
// 	handler: handleUserCreate,
// };

createUser()
	.catch((error) => {
		console.error(`Failed to create user: ${error}`);
	});
