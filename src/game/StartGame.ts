import { Game as MainGame } from './scenes/Game';
import { AUTO, Game, Types } from 'phaser';

// Find out more information about the Game Config at:
// https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
export const WIDTH = 1024;
export const HEIGHT = 768;

const config: Types.Core.GameConfig = {
  type: AUTO,
  width: WIDTH,
  height: HEIGHT,
  parent: 'game-container',
  backgroundColor: '#3c751c',
  scene: [MainGame],
  physics: {
    default: 'arcade',
    arcade: {
      debug: false
    }
  }
};

const StartGame = (parent: string) => {
  return new Game({ ...config, parent });
};

export default StartGame;
