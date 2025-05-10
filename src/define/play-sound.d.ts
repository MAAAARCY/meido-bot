declare module 'play-sound' {
    interface Player {
        play(file: string, callback?: (error: Error | null) => void): void;
    }
    function player(): Player;
    export = player;
} 