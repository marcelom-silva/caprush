
    // Phaser + Matter.js Config
    const config = {
        type: Phaser.AUTO,
        physics: {
            default: 'matter',
            matter: {
                gravity: { x: 0, y: 0 },
                friction: 0.1,
                restitution: 0.6, // Bounce
                debug: true
            }
        },
        scene: {
            preload: preload,
            create: create,
            update: update
        }
    };
    