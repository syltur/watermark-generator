const Jimp = require('jimp');
const inquirer = require('inquirer')
const fs = require('fs')

const addTextWatermarkToImage = async function (inputFile, outputFile, text) {
  try {
    const image = await Jimp.read(inputFile);
    const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
    const textData = {
      text,
      alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
      alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE,
    }
    image.print(font, 0, 0, textData, image.getWidth(), image.getHeight());
    await image.quality(100).writeAsync(outputFile);
    return image
  } catch (error) {
    console.log('Something went wrong... Try again!')
  }
};

const addImageWatermarkToImage = async function (inputFile, outputFile, watermarkFile) {
  try {
    const image = await Jimp.read(inputFile);
    const watermark = await Jimp.read(watermarkFile);
    const x = image.getWidth() / 2 - watermark.getWidth() / 2;
    const y = image.getHeight() / 2 - watermark.getHeight() / 2;

    image.composite(watermark, x, y, {
      mode: Jimp.BLEND_SOURCE_OVER,
      opacitySource: 0.5,
    });
    await image.quality(100).writeAsync(outputFile);
    return image
  } catch (error) {
    console.log('Something went wrong... Try again!')
  }
};

const additionalEdition = (image, method) => {
  switch (method) {
    case 'Invert image': {
      return image.invert();
    }
    case 'Make image brighter': {
      return image.brightness(0.5);
    }
    case 'Increase contrast': {
      return image.contrast(0.5);
    }
    case 'Make image b&w': {
      return image.greyscale();
    }
    default:
      return image;
  }
}

const prepareOutputFilename = (originFileName) => {
  const fileNameParts = originFileName.split('.')
  fileNameParts[0] = fileNameParts[0] + '-with-watermark'
  return fileNameParts.join('.')
}

const startApp = async () => {
  const answer = await inquirer.prompt([{
    name: 'start',
    message: 'Hi! Welcome to "Watermark manager". Copy your image files to `/img` folder. Then you\'ll be able to use them in the app. Are you ready?',
    type: 'confirm'
  }]);

  if (!answer.start) process.exit();

  const options = await inquirer.prompt([{
    name: 'inputImage',
    type: 'input',
    message: 'What file do you want to mark?',
    default: 'test.jpg',
  },
  {
    name: 'editQuestion',
    message: 'Do you want to edit image?',
    type: 'confirm',
  }])

  let edit = null
  if (options.editQuestion) {
    edit = await inquirer.prompt([{
      name: 'editionType',
      type: 'list',
      choices: ['Make image brighter', 'Increase contrast', 'Make image b&w', 'Invert image']
      ,
    }])
  }
  const watermarkChoose = await inquirer.prompt([{

    name: 'watermarkType',
    type: 'list',
    choices: ['Text watermark', 'Image watermark'],
  }]);

  if (watermarkChoose.watermarkType === 'Text watermark') {
    const text = await inquirer.prompt([{
      name: 'value',
      type: 'input',
      message: 'Type your watermark text:',
    }]);
    watermarkChoose.watermarkText = text.value;
    if (fs.existsSync('./img/' + options.inputImage)) {
      const image = await addTextWatermarkToImage('./img/' + options.inputImage, './img/' + prepareOutputFilename(options.inputImage), watermarkChoose.watermarkText);
      await additionalEdition(image, edit.editionType).quality(100).writeAsync('./img/' + prepareOutputFilename(options.inputImage));
      console.log('Success!')
    } else {
      console.log('Something went wrong... Try again');
      process.exit();
    }
    startApp();
  }
  else {
    const image = await inquirer.prompt([{
      name: 'filename',
      type: 'input',
      message: 'Type your watermark name:',
      default: 'logo.png',
    }]);
    watermarkChoose.watermarkImage = image.filename;
    if (fs.existsSync('./img/' + options.inputImage) && fs.existsSync('./img/' + watermarkChoose.watermarkImage)) {
      const image = await addImageWatermarkToImage('./img/' + options.inputImage, './img/' + prepareOutputFilename(options.inputImage), './img/' + watermarkChoose.watermarkImage);
      await additionalEdition(image, edit.editionType).quality(100).writeAsync('./img/' + prepareOutputFilename(options.inputImage));
      console.log('Success!')
    } else {
      console.log('Something went wrong... Try again');
      process.exit();
    }
    startApp();
  }

}

startApp();