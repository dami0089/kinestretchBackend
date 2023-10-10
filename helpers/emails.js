import nodemailer from "nodemailer";

// TODO: mejorar los html de los mail que llegan a los clientes.

export const emailRegistro = async (datos) => {
  const { email, nombre, token } = datos;

  const hemail = process.env.EMAIL;
  const hpass = process.env.PASSWORD;
  const host = process.env.HOST;
  const port = process.env.EMAIL_PORT;

  const transport = nodemailer.createTransport({
    host: host,
    port: port,
    auth: {
      user: hemail,
      pass: hpass,
    },
  });

  //informacion del email

  const info = await transport.sendMail({
    from: '"Kinestretch - Bienvenid@!" <info@peopleco.com.ar>',
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
};

export const emailOlvidePassword = async (datos) => {
  const { email, nombre, token } = datos;

  const hemail = process.env.EMAIL;
  const hpass = process.env.PASSWORD;
  const host = process.env.HOST;
  const port = process.env.EMAIL_PORT;

  const transport = nodemailer.createTransport({
    host: host,
    port: port,
    auth: {
      user: hemail,
      pass: hpass,
    },
  });

  //informacion del email

  const info = await transport.sendMail({
    from: '"People Coworking" <info@peopleco.com.ar>',
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

export const emailReservaSala = async (datos) => {
  const { email, nombre, sala, fecha, horaInicio, horaFin } = datos;

  const hemail = process.env.EMAIL;
  const hpass = process.env.PASSWORD;
  const host = process.env.HOST;
  const port = process.env.EMAIL_PORT;

  const transport = nodemailer.createTransport({
    host: host,
    port: port,
    auth: {
      user: hemail,
      pass: hpass,
    },
  });

  //informacion del email

  const info = await transport.sendMail({
    from: '"People Coworking" <info@peopleco.com.ar>',
    to: email,
    subject: `Reserva Creada en ${sala}`,
    text: `Reserva Creada en ${sala}`,
    html: `
        <p>Hola ${nombre}</p>
        <p>A continuacion te compartimos los detalles de tu reserva:</p>
        <p>\nFecha: ${fecha}</p>
        <p>\nHora Inicio: ${horaInicio}</p>
        <p>\nHora Fin: ${horaFin}</p>

        <p>Recorda que si necesitas cancelar la misma podras hacerlo desde nuestra web, o bien informando a nuestro personal.</p>

       
    `,
  });
};
