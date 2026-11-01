export default class SoundManager {
    constructor() {
        this.soundLibrary = {}
        this.currentMusic = null

        this.volume = 1.0
    }

    loadSound(name, filePath)    
    {
        if (name == null || filePath == null)
        {
            console.warn("Sound name and file path are required")
            return
        }

        let audioInstance = new Audio(filePath)
        
        audioInstance.preload = "auto"

        this.soundLibrary[name] = audioInstance
    }

    playSFX(name){
        if (!this.soundLibrary[name])
        {
            console.warn("Sound effect " + name + " was not found in library")
            return
        }

        let sfxInstance = this.soundLibrary[name].cloneNode()
        sfxInstance.volume = this.volume
        sfxInstance.play()

        return sfxInstance;
    }

    playMusic(name, loop = true){
        if (!this.soundLibrary[name])
        {
            console.warn("Music track " + name + " was not found in library")
            return
        }

        if (this.currentMusic != null)
        {
            this.currentMusic.pause()
            this.currentMusic.currentTime = 0
        }

        this.currentMusic = this.soundLibrary[name]
        this.currentMusic.loop = loop
        this.currentMusic.volume = this.volume

        this.currentMusic.play()
    }

    stopMusic(){
        if (this.currentMusic != null)
        {
            this.currentMusic.pause()
            this.currentMusic.currentTime = 0
            this.currentMusic = null
        }
    }

    setVolume(newVolume){
        if (newVolume < 0.0)
        {
            this.volume = 0
        }
        else if (this.volume > 1.0)
        {
            this.volume = 1.0
        }
        else{
            this.volume = newVolume
        }

        if (this.currentMusic != null)
        {
            this.currentMusic.volume = this.volume
        }
    }
}