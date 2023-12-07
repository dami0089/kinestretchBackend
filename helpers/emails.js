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
