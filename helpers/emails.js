import nodemailer from "nodemailer";

// TODO: mejorar los html de los mail que llegan a los clientes.

export const emailRegistro = async (datos) => {
	const { email, nombre, token } = datos;

	const hemail = process.env.EMAIL;
	const hpass = process.env.PASSWORD;

	const transport = nodemailer.createTransport({
		service: "gmail",
		auth: {
			type: "OAuth2",
			user: "posturalapp.arg@gmail.com",
			clientId: process.env.clientId,
			clientSecret: process.env.clientSecret,
			refreshToken: process.env.refreshToken,
		},
	});

	//informacion del email

	try {
		const info = await transport.sendMail({
			from: '"Kinestretch - Bienvenid@!" <posturalapp.arg@gmail.com>',
			to: email,
			subject: "Alta de cuenta",
			text: "Verifica tu cuenta en Kinestretch",
			html: `
          <p>Hola ${nombre}, bienvenid@ a Kinestretch</p>
          <p>Hemos creado tu cuenta para que puedas gestionar tus reservas, cancelaciones y mucho mas. Solo debes configurar una contraseña y puedes hacerlo en el siguiente enlace: <a href='${process.env.FRONTEND_URL}/crear-password/${token}'>Configurar Pass</a></p>
  
          <p>Si no acabas de darte de alta en Kinestretch, puedes ignorar este mensaje.</p>
  
          <p>Que tengas un gran dia!</p>
          <p>Kinestretch</p>
      `,
		});
	} catch (error) {
		console.log(error);
	}
};

export const emailOlvidePassword = async (datos) => {
	const { email, nombre, token } = datos;

	const transport = nodemailer.createTransport({
		service: "gmail",
		auth: {
			type: "OAuth2",
			user: "posturalapp.arg@gmail.com",
			clientId: process.env.clientId,
			clientSecret: process.env.clientSecret,
			refreshToken: process.env.refreshToken,
		},
	});

	//informacion del email

	const info = await transport.sendMail({
		from: '"Kinestretch - Bienvenid@!" <posturalapp.arg@gmail.com>',
		to: email,
		subject: "Reestablece tu Password",
		text: "Reestablece tu Password",
		html: `
        <p>Hola ${nombre} has solicitado reestablecer tu password en nuestro sistema</p>
        <p>sigue siguiente enlace para generar un nuevo password: <a href='${process.env.FRONTEND_URL}/olvide-password/${token}'>Reestablecer Password</a></p>

        <p>Si tu no solicitaste este cambio, puedes ignorar el mensaje</p>

       
    `,
	});
};

export const emailClaseCancelada = async (datos) => {
	const { email, nombre } = datos;

	const hemail = process.env.EMAIL;
	const hpass = process.env.PASSWORD;

	const transport = nodemailer.createTransport({
		service: "gmail",
		auth: {
			type: "OAuth2",
			user: "posturalapp.arg@gmail.com",
			clientId: process.env.clientId,
			clientSecret: process.env.clientSecret,
			refreshToken: process.env.refreshToken,
		},
	});

	//informacion del email
	console.log("Envio email");
	try {
		const info = await transport.sendMail({
			from: '"Kinestretch - Bienvenid@!" <posturalapp.arg@gmail.com>',
			to: email,
			subject: "Clase Cancelada",
			text: "Clase Cancelada",
			html: `
          <p>Hola ${nombre}</p>
          <p>Te confirmamos que tu clase ha sido cancelada con exito! </p>
    
          <p>Que tengas un gran dia!</p>
          <p>Kinestretch</p>
      `,
		});
		console.log(info);
	} catch (error) {
		console.log(error);
	}
};

export const emailProfesorClaseAsignada = async (datos) => {
	const { email, nombre } = datos;

	const hemail = process.env.EMAIL;
	const hpass = process.env.PASSWORD;

	const transport = nodemailer.createTransport({
		service: "gmail",
		auth: {
			type: "OAuth2",
			user: "posturalapp.arg@gmail.com",
			clientId: process.env.clientId,
			clientSecret: process.env.clientSecret,
			refreshToken: process.env.refreshToken,
		},
	});

	//informacion del email

	try {
		const info = await transport.sendMail({
			from: '"Kinestretch - Bienvenid@!" <posturalapp.arg@gmail.com>',
			to: email,
			subject: "Clase Asignada",
			text: "Clase Asignada",
			html: `
          <p>Hola ${nombre}</p>
          <p>Te informamos que te hemos asignado una nueva clase. Podes ver los datos desde nuestra web haciendo clic en el siguiente enlace --> <a href='https://postural.com.ar'>Ingresar a mi cuenta</a></p>
    
          <p>Que tengas un gran dia!</p>
          <p>Kinestretch</p>
      `,
		});
	} catch (error) {
		console.log(error);
	}
};

export const emailRegistroNuevo = async (datos) => {
	const { email, nombre } = datos;

	const hemail = process.env.EMAIL;
	const hpass = process.env.PASSWORD;

	const transport = nodemailer.createTransport({
		service: "gmail",
		auth: {
			type: "OAuth2",
			user: "posturalapp.arg@gmail.com",
			clientId: process.env.clientId,
			clientSecret: process.env.clientSecret,
			refreshToken: process.env.refreshToken,
		},
	});

	const info = await transport.sendMail({
		from: 'Kinestretch - Bienvenid@!" <posturalapp.arg@gmail.com>',
		to: email,
		subject: `👋🏼 Alta de cuenta`,
		text: "Alta de cuenta",
		html: `
      <div style="margin: 0; padding: 0; font-family: Arial, sans-serif">
			<style>
				@media only screen {
					.responsive-table {
						width: 100% !important;
					}

					.responsive-image {
						width: 100% !important;
						height: auto !important;
					}

					.responsive-padding {
						padding: 10px !important;
					}

					.responsive-text {
						font-size: 14px !important;
					}
				}
			</style>
			<div
				style="
					max-width: 620px;
					margin: auto;
					overflow: hidden;
					margin-top: 20px;
				"
				class="wrapper"
			>
				<div style="text-align: left">
					<img
						src="https://www.kinestretch.com.ar/wp-content/uploads/2024/04/Asset-85@2x-8.png"
						class="responsive-image"
						style="width: 100%; background-size: cover"
					/>
				</div>
				<div style="text-align: center; margin-top: 35px; margin-bottom: 15px">
					<img
						src="https://www.kinestretch.com.ar/wp-content/uploads/2024/04/Asset-41@2x-8.png"
						style="
							height: 5px;
							width: 170px;
							background-size: cover;
							margin-top: 10px;
						"
					/>
				</div>

				<div style="text-align: left">
					<img
						src="https://www.kinestretch.com.ar/wp-content/uploads/2024/04/Asset-86@2x-8.png"
						class="responsive-image"
						style="width: 100%; background-size: cover; margin-top: 30px"
					/>
				</div>

				<p style="text-align: center; margin-top: 30px; font-size: 20px">
					<span style="font-weight: bold">Estimada ${nombre}</span> preparamos tu
					<span style="font-weight: bold"> cuenta personal</span>, diseñada para
					ofrecerte una
					<span style="color: #00aef2"
						>experiencia cómoda, fácil y eficiente. La contraseña para ingresar es tu DNI, podras cambiarla cuando gustes</span
					>
				</p>

				<p style="text-align: center; margin-top: 30px">
					<span style="font-weight: bold; font-size: 20px"
						>Con nuestro sistema exclusivo, vas a poder:</span
					>
				</p>

				<div style="text-align: left">
					<img
						src="https://www.kinestretch.com.ar/wp-content/uploads/2024/04/Asset-42@2x-8.png"
						class="responsive-image"
						style="width: 100%; background-size: cover"
					/>
				</div>

				<a href='${process.env.FRONTEND_URL}' style="text-align: center; display: block; margin-top: 25px">
    <img
        src="https://www.kinestretch.com.ar/wp-content/uploads/2024/04/Asset-49@2x-8.png"
        style="height: 37px; width: 263px; background-size: cover"
    />
</a>


				<div style="text-align: left; margin-top: 20px">
					<img
						src="https://www.kinestretch.com.ar/wp-content/uploads/2024/04/Asset-44@2x-8.png"
						class="responsive-image"
						style="width: 100%; background-size: cover; margin-top: 20px"
					/>
				</div>

				<div style="text-align: center; margin-top: 15px">
					<img
						src="https://www.kinestretch.com.ar/wp-content/uploads/2024/04/Asset-95@2x-8.png"
						style="
							height: 45px;
							width: 450px;
							background-size: cover;
							margin-top: 15px;
						"
					/>
				</div>

        <div style="text-align: left; margin-top: 25px; background-color: #ededed; border-top: 2px; border-left: 0px; border-right: 0px; border-bottom: 0px; border-style: dashed; border-color: black;">
					<img
						src="https://www.kinestretch.com.ar/wp-content/uploads/2024/04/Asset-96@2x-8.png"
						class="responsive-image"
						style="
							height: 15%;
							width: 100%;
							background-size: cover;
							margin-top: 15px;
						
						"
					/>

				<div style="text-align: left">
					<img
						src="https://www.kinestretch.com.ar/wp-content/uploads/2024/04/Asset-52@2x-8.png"
						class="responsive-image"
						style="
							height: 15%;
							width: 100%;
							background-size: cover;
							margin-top: 15px;
						"
					/>
				</div>
			</div>
		</div>
          `,
	});
};

export const claseAsignada = async (
	sede,
	direccion,
	diayhorario,
	profe,
	email
) => {
	const hemail = process.env.EMAIL;
	const hpass = process.env.PASSWORD;

	const transport = nodemailer.createTransport({
		service: "gmail",
		auth: {
			type: "OAuth2",
			user: "posturalapp.arg@gmail.com",
			clientId: process.env.clientId,
			clientSecret: process.env.clientSecret,
			refreshToken: process.env.refreshToken,
		},
	});

	const info = await transport.sendMail({
		from: 'Kinestretch!" <posturalapp.arg@gmail.com>',
		to: email,
		subject: `👍🏽 Clase Asignada`,
		text: "Clase Asignada",
		html: `
      <div
				style="
					max-width: 620px;
					margin: auto;
					overflow: hidden;
					margin-top: 20px;
				"
				class="wrapper"
			>
				<div style="text-align: left">
					<img
						src="https://www.kinestretch.com.ar/wp-content/uploads/2024/04/Asset-84@2x-8.png"
						class="responsive-image"
						style="width: 100%; background-size: cover"
					/>
				</div>
				<div style="text-align: center; margin-top: 30px; margin-bottom: 15px">
					<img
						src="https://www.kinestretch.com.ar/wp-content/uploads/2024/04/Asset-40@2x-8.png"
						style="
							height: 5px;
							width: 170px;
							background-size: cover;
							margin-top: 10px;
						"
					/>
				</div>

				<div style="text-align: left">
					<img
						src="https://www.kinestretch.com.ar/wp-content/uploads/2024/04/Asset-88@2x-8.png"
						class="responsive-image"
						style="width: 100%; background-size: cover; margin-top: 30px"
					/>
				</div>

				<div style="text-align: center; margin-top: 15px">
					
					<img
						src="https://www.kinestretch.com.ar/wp-content/uploads/2024/04/Asset-97@2x-8.png"
						style="
							height: 45px;
							width: 450px;
							background-size: cover;
							margin-top: 15px;

						"

					/>
				</div>


					<table style=" border-collapse: collapse; margin-top: 50px; margin-bottom: 50px; justify-content: center ; align-items: center">

					<tr >
							<td style="text-align: left; padding: 10px;"><img
							src="https://www.kinestretch.com.ar/wp-content/uploads/2024/04/Asset-45@2x-8.png"
							style="
							height: 36px;
							width: 36px;
							background-size: cover;
							"

							/></td>
							<td style="text-align: left; padding: 10px;"><div style="font-size: 25px; font-weight: 700; ">${sede}</div></td>
								</tr>
					<tr>
							<td style="text-align: left; padding: 10px;"><img
							src="https://www.kinestretch.com.ar/wp-content/uploads/2024/04/Asset-48@2x-8.png"
							style="
							height: 36px;
							width: 36px;
							background-size: cover;

							"

							/></td>
							<td style="text-align: left; padding: 10px;"><div style="font-size: 25px; font-weight: 700;" >${diayhorario}</div></td>
					</tr>
					<tr>
							<td style="text-align: left; padding: 10px;"><img
							src="https://www.kinestretch.com.ar/wp-content/uploads/2024/04/Asset-46@2x-8.png"
							style="
							height: 36px;
							width: 36px;
							background-size: cover;

							"

							/></td>
							<td style="text-align: left; padding: 10px;"><div style="font-size: 25px; font-weight: 700;">${direccion}</div></td>
							</tr>
					<tr>
							<td style="text-align: left; padding: 10px;"><img
							src="https://www.kinestretch.com.ar/wp-content/uploads/2024/04/Asset-47@2x-8.png"
							style="
							height: 36px;
							width: 36px;
							background-size: cover;
							"

							/></td>
							<td style="text-align: left; padding: 10px;"><div style="font-size: 25px; font-weight: 700;" >${profe}</div></td>
					</tr>
					</table>

				



				

				<div style="text-align: left; ">
					<img
						src="https://www.kinestretch.com.ar/wp-content/uploads/2024/04/Asset-53@2x-8.png"
						class="responsive-image"
						style="width: 100%; background-size: cover"
						class="responsive-image"
					/>
				</div>

				<div style="text-align: left; background-color: #E8E8E8; margin-top: 30px; padding: 30px;">
					<img
						src="https://www.kinestretch.com.ar/wp-content/uploads/2024/04/Asset-35-8.png"
						class="responsive-image"
						style="width: 100%; background-size: cover"
					/>

					<img
						src="https://www.kinestretch.com.ar/wp-content/uploads/2024/04/Asset-34-8.png"
						class="responsive-image"
						style="width: 100%; background-size: cover"
					/>

					<img
						src="https://www.kinestretch.com.ar/wp-content/uploads/2024/04/Asset-58@2x-8.png"
						class="responsive-image"
						style="width: 100%; background-size: cover"
					/>
				</div>



				<div style="text-align: center; margin-top: 15px">
					
					<img
						src="https://www.kinestretch.com.ar/wp-content/uploads/2024/04/Asset-98@2x-8.png"
						style="
							height: 65px;
							width: 300px;
							background-size: cover;
							margin-top: 15px;

						"
						class="responsive-image"

					/>
				</div>

				<div style="text-align: center; margin-top: 15px">
					
					<img
						src="https://www.kinestretch.com.ar/wp-content/uploads/2024/04/Asset-99@2x-8.png"
						style="
							height: 35px;
							width: 300px;
							background-size: cover;
							margin-top: 15px;

						"
						class="responsive-image"

					/>
				</div>

			<div style="width: 100%; display: block; text-align: center; margin-top: 20px; justify-content: center;">
				<a href="https://postural.com.ar">
<img
			src="https://www.kinestretch.com.ar/wp-content/uploads/2024/04/Asset-49@2x-8.png"
			style="
			height: 40px;
			width: 200px;
			background-size: cover;
			"
			class="responsive-image"

			/>
				</a>
			
			<a href="https://youtu.be/hySMqtM3vW8?si=sMhj1yo96LsRIWEP">
<img
			src="https://www.kinestretch.com.ar/wp-content/uploads/2024/04/Asset-50@2x-8.png"
			style="
			height: 40px;
			width: 200px;
			background-size: cover; margin-top: 20px ;
			"
			class="responsive-image"

			/>
			</a>
			
			</div>

			<div style="text-align: center; margin-top: 15px">
					
					<img
						src="https://www.kinestretch.com.ar/wp-content/uploads/2024/04/Asset-51@2x-8.png"
						style="
							height: 45px;
							width: 300px;
							background-size: cover;
							margin-top: 15px;

						"
			class="responsive-image"

					/>
				</div>

				<div style="text-align: left">
					<img
						src="https://www.kinestretch.com.ar/wp-content/uploads/2024/04/Asset-52@2x-8.png"
						class="responsive-image"
						style="width: 100%; background-size: cover"
			class="responsive-image"


					/>
				</div>

        
		</div>
          `,
	});
};

export const encuesta = async (email, id) => {
	const hemail = process.env.EMAIL;
	const hpass = process.env.PASSWORD;

	const transport = nodemailer.createTransport({
		service: "gmail",
		auth: {
			type: "OAuth2",
			user: "posturalapp.arg@gmail.com",
			clientId: process.env.clientId,
			clientSecret: process.env.clientSecret,
			refreshToken: process.env.refreshToken,
		},
	});

	const info = await transport.sendMail({
		from: 'Kinestretch!" <posturalapp.arg@gmail.com>',
		to: email,
		subject: `🙏🏼 Gracias por venir!`,
		text: "Gracias por venir",
		html: `
      <div style="margin: 0; padding: 0; font-family: Arial, sans-serif">
  <style>
    @media only screen and (max-width: 620px) {
      .responsive-table {
        width: 100% !important;
      }
      .responsive-image {
        width: 100% !important;
        height: auto !important;
      }
      .responsive-padding {
        padding: 10px !important;
      }
      .responsive-text {
        font-size: 14px !important;
      }
      .wrapper {
        width: 100% !important;
        overflow: hidden;
        margin-top: 20px;
      }
    }
  </style>
			<div
				style="
					max-width: 620px;
					margin: auto;
					overflow: hidden;
					margin-top: 20px;
				"
				class="wrapper"
			>
				<div style="text-align: left">
					<img
						src="https://www.kinestretch.com.ar/wp-content/uploads/2024/04/Asset-78@2x-8.png"
						class="responsive-image"
						style="width: 100%; background-size: cover"
					/>
				</div>
				<div style="text-align: center; margin-top: 30px; margin-bottom: 15px">
					<img
						src="https://www.kinestretch.com.ar/wp-content/uploads/2024/04/Asset-39@2x-8.png"
						style="
							height: 5px;
							width: 250px;
							background-size: cover;
							margin-top: 10px;
						"
						class="responsive-image"

					/>
				</div>

				<div style="text-align: center; ">
					<img
						src="https://www.kinestretch.com.ar/wp-content/uploads/2024/04/Asset-87@2x-8.png"
						class="responsive-image"
						style="
							height: 35px;
							width: 320px;
							background-size: cover;
							margin-top: 10px;
						"
					/>
				</div>

				<div style="text-align: center; margin-top: 15px">
					
					<img
						src="https://www.kinestretch.com.ar/wp-content/uploads/2024/04/Asset-101@2x-8.png"
						style="
							height: 20px;
							width: 250px;
							background-size: cover;
							margin-top: 10px;
						"
						class="responsive-image"


					/>
				</div>
			

				<div style="text-align: left; ">
					<img
						src="https://www.kinestretch.com.ar/wp-content/uploads/2024/04/Asset-54@2x-8.png"
						class="responsive-image"
						style="width: 100%; background-size: cover; margin-top: 20px;"
						class="responsive-image"
					/>
				</div>

				<div style="text-align: left; background-color: #E8E8E8; margin-top: 30px; padding: 30px;">
					<img
						src="https://www.kinestretch.com.ar/wp-content/uploads/2024/04/Asset-55@2x-8.png"
						class="responsive-image"
						style="width: 100%; background-size: cover"
					/>

					<img
						src="https://www.kinestretch.com.ar/wp-content/uploads/2024/04/Asset-56@2x-8.png"
						class="responsive-image"
						style="width: 100%; background-size: cover"
					/>

					<img
						src="https://www.kinestretch.com.ar/wp-content/uploads/2024/04/Asset-58@2x-8.png"
						class="responsive-image"
						style="width: 100%; background-size: cover"
					/>

					<img
						src="https://www.kinestretch.com.ar/wp-content/uploads/2024/04/Asset-57@2x-8.png"
						class="responsive-image"
						style="width: 100%; background-size: cover"
					/>
				</div>



				<div style="text-align: center; margin-top: 15px">
					
					<img
						src="https://www.kinestretch.com.ar/wp-content/uploads/2024/04/Asset-59@2x-8.png"
						style="
							height: 45px;
							width: 550px;
							background-size: cover;
							margin-top: 15px;
							

						"
						class="responsive-image"

					/>
				</div>

				<div style="text-align: center; margin-top: 15px">
					
					<img
						src="https://www.kinestretch.com.ar/wp-content/uploads/2024/04/Asset-102@2x-8.png"
						style="
							height: 20px;
							width: 400px;
							background-size: cover;
							margin-top: 15px;

						"
						class="responsive-image"

					/>
				</div>

				<div style="text-align: center; margin-top: 15px">
					
					<img
						src="https://www.kinestretch.com.ar/wp-content/uploads/2024/04/Asset-103@2x-8.png"
						style="
							height: 15px;
							width: 300px;
							background-size: cover;
							margin-top: 10px;

						"
						class="responsive-image"

					/>
				</div>

				

			<div style="text-align: center; margin-top: 15px; display: flex; justify-content: center;">
					
				<a href='${process.env.FRONTEND_URL}/encuesta/${id}/1'><img
						src="https://www.kinestretch.com.ar/wp-content/uploads/2024/04/Asset-62@2x-8.png"
						style="
							height: 100px;
							width: 100px;
							background-size: cover;
							margin-top: 15px;
							margin-right: 10px;

						"
						class="responsive-image"

			/></a>
					<a href='${process.env.FRONTEND_URL}/encuesta/${id}/2'><img
						src="https://www.kinestretch.com.ar/wp-content/uploads/2024/04/Asset-61@2x-8.png"
						style="
							height: 100px;
							width: 100px;
							background-size: cover;
							margin-top: 15px;
							margin-right: 10px;

						"
			class="responsive-image"

					/></a>
					<a href='${process.env.FRONTEND_URL}/encuesta/${id}/3'><img
						src="https://www.kinestretch.com.ar/wp-content/uploads/2024/04/Asset-60@2x-8.png"
						style="
							height: 100px;
							width: 100px;
							background-size: cover;
							margin-top: 15px;
							margin-right: 10px;

						"
			class="responsive-image"

					/></a>
					
				</div>

				<div style="text-align: left; margin-top: 20px;">
					<img
						src="https://www.kinestretch.com.ar/wp-content/uploads/2024/04/Asset-52@2x-8.png"
						class="responsive-image"
						style="width: 100%; background-size: cover"
			class="responsive-image"


					/>
				</div>

        
		</div>
          `,
	});
};

export const notificacionEncuesta = async (
	pregunta1,
	pregunta2,
	pregunta3,
	pregunta4,
	cliente
) => {
	const { nombre, apellido } = cliente;

	const hemail = process.env.EMAIL;
	const hpass = process.env.PASSWORD;

	const transport = nodemailer.createTransport({
		service: "gmail",
		auth: {
			type: "OAuth2",
			user: "posturalapp.arg@gmail.com",
			clientId: process.env.clientId,
			clientSecret: process.env.clientSecret,
			refreshToken: process.env.refreshToken,
		},
	});

	//informacion del email

	try {
		const info = await transport.sendMail({
			from: '"Kinestretch" <posturalapp.arg@gmail.com>',
			to: "posturalapp.arg@gmail.com",
			subject: "🗒️ Encuesta Recibida",
			text: "Encuesta Recibida",
			html: `
          <p>Hola!, Hemos recibido una nueva encuesta del cliente ${nombre} ${apellido}</p>
          <p><b>Pregunta 1: ¿Te gusto la clase?</b></p>
		  <p>${pregunta1}</p>
		  <p><b>Pregunta 2: ¿Notaste alguna diferencia después de la clase?</b></p>
		  <p>${pregunta2}</p>
		  <p><b>Pregunta 3: ¿Te sentiste acompañado/a por el profesional que dio la clase?</b></p>
		  <p>${pregunta3}</p>
		  <p><b>Pregunta 4: ¿Puedes comentarnos más sobre tu experiencia en Kinestretch?</b></p>
		  <p>${pregunta4}</p>
  
  
          <p>Que tengas un gran dia!</p>
          <p>Kinestretch</p>
      `,
		});
	} catch (error) {
		console.log(error);
	}
};

export const mensajeGrupaloIndividual2 = async (email, mensaje, asunto) => {
	const hemail = process.env.EMAIL;
	const hpass = process.env.PASSWORD;

	const transport = nodemailer.createTransport({
		service: "gmail",
		auth: {
			type: "OAuth2",
			user: "posturalapp.arg@gmail.com",
			clientId: process.env.clientId,
			clientSecret: process.env.clientSecret,
			refreshToken: process.env.refreshToken,
		},
	});

	const info = await transport.sendMail({
		from: 'Kinestretch!" <posturalapp.arg@gmail.com>',
		to: email,
		subject: `👋🏼 ${asunto}`,
		text: `${asunto}`,
		html: `<body>
		<div style="margin: 0; padding: 0; font-family: Arial, sans-serif">
  <style>
    @media only screen and (max-width: 620px) {
      .responsive-table {
        width: 100% !important;
      }
      .responsive-image {
        width: 100% !important;
        height: auto !important;
      }
      .responsive-padding {
        padding: 10px !important;
      }
      .responsive-text {
        font-size: 14px !important;
      }
      .wrapper {
        width: 100% !important;
        overflow: hidden;
        margin-top: 20px;
      }
    }
  </style>
			<div
				style="
					max-width: 620px;
					margin: auto;
					overflow: hidden;
					margin-top: 20px;
				"
				class="wrapper"
			>
				<div style="text-align: left">
					<img
						src="https://www.kinestretch.com.ar/wp-content/uploads/2024/04/Asset-80@2x-8.png"
						class="responsive-image"
						style="width: 100%; background-size: cover"
					/>
				</div>
				<div style="text-align: center">
					<h1 style="color: #17409C;">${asunto}</h1>
				</div>

				<div style="text-align: center">
					<p style="color: #17409C;">${mensaje}</p>
				</div>

				<div style="text-align: left; margin-top: 20px;">
					<img
						src="https://www.kinestretch.com.ar/wp-content/uploads/2024/04/Asset-52@2x-8.png"
						class="responsive-image"
						style="width: 100%; background-size: cover"
			class="responsive-image"

					/>
				</div>

		</div>
	</body>`,
	});
};

export const mensajeGrupaloIndividual = async (email, mensaje, asunto) => {
	const apiKey = process.env.API_ENVIALO_SIMPLE; // Asegúrate de definir esta variable en tu entorno
	const url = "https://api.envialosimple.email/api/v1/mail/send"; // Endpoint de Envialo Simple

	const emailBody = {
		from: {
			name: "Kinestretch",
			email: "postural@kinestretch.com.ar",
		},
		to: email,
		subject: `👋🏼 ${asunto}`,
		html: `
      <body>
        <div style="margin: 0; padding: 0; font-family: Arial, sans-serif">
          <style>
            @media only screen and (max-width: 620px) {
              .responsive-table {
                width: 100% !important;
              }
              .responsive-image {
                width: 100% !important;
                height: auto !important;
              }
              .responsive-padding {
                padding: 10px !important;
              }
              .responsive-text {
                font-size: 14px !important;
              }
              .wrapper {
                width: 100% !important;
                overflow: hidden;
                margin-top: 20px;
              }
            }
          </style>
          <div style="max-width: 620px; margin: auto; overflow: hidden; margin-top: 20px;" class="wrapper">
            <div style="text-align: left">
              <img src="https://www.kinestretch.com.ar/wp-content/uploads/2024/04/Asset-80@2x-8.png" class="responsive-image" style="width: 100%; background-size: cover" />
            </div>
            <div style="text-align: center">
              <h1 style="color: #17409C;">${asunto}</h1>
            </div>
            <div style="text-align: center">
              <p style="color: #17409C;">${mensaje}</p>
            </div>
            <div style="text-align: left; margin-top: 20px;">
              <img src="https://www.kinestretch.com.ar/wp-content/uploads/2024/04/Asset-52@2x-8.png" class="responsive-image" style="width: 100%; background-size: cover" />
            </div>
          </div>
        </div>
      </body>
    `,
	};

	const config = {
		method: "POST",
		headers: {
			Authorization: `Bearer ${apiKey}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify(emailBody),
	};

	try {
		const response = await fetch(url, config);

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(
				`Error al enviar el correo: ${errorData.message || response.statusText}`
			);
		}

		const result = await response.json();
		console.log("Correo enviado:", result);
	} catch (error) {
		console.error("Error en el envío:", error.message);
	}
};
