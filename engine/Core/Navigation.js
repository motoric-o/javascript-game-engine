import { Pathfinding } from "three-pathfinding";

export default class Navigation {
    constructor() {
        this.pathfinder = new Pathfinding()
        this.zones = new Set();
    }

    loadNavMesh(zoneName, geometry) {
        if (!zoneName || !geometry?.isBufferGeometry){
            console.error("ERROR: NavMesh requires a zone name and BufferGeometry!");
            return this;
        }
        const zone = Pathfinding.createZone(geometry);

        this.pathfinder.setZoneData(zoneName, zone);
        this.zones.add(zoneName);

        return this;
    }

    hasZone(zoneName) {
        return this.zones.has(zoneName);
    }

    getGroup(zoneName, position) {
        if(!this.hasZone(zoneName) || !position){
            console.error("ERROR: zoneName doesn't exist or position is missing!");
            return null;
        }

        return this.pathfinder.getGroup(zoneName, position);
    }

    findPath(from, to, zoneName) {
       if (!this.hasZone(zoneName) || !from || !to){
            console.error("ERROR: zoneName doesn't exist or from/to is missing!");
            return [];
        }

        const groupID = this.getGroup(zoneName,from);
        if (groupID == null){
            return[]
        }
        
        /** AIMOD
         * prompt: something's wrong, it's not chasing me / alright you can help me with that (snap from/to vertically onto closest NavMesh node so capsule center height doesn't break findPath)
         */
        const startNode = this.pathfinder.getClosestNode(from, zoneName, groupID);
        const endNode = this.pathfinder.getClosestNode(to, zoneName, groupID);

        const snappedFrom = startNode ? from.clone().setY(startNode.centroid.y) : from;
        const snappedTo = endNode ? to.clone().setY(endNode.centroid.y) : to;

        let wayPoint = this.pathfinder.findPath(
            snappedFrom,
            snappedTo,
            zoneName,
            groupID
        );

        if (!wayPoint && startNode && endNode) {
            wayPoint = this.pathfinder.findPath(
                startNode.centroid,
                endNode.centroid,
                zoneName,
                groupID
            );
        }

        // USER
        return wayPoint ?? [];
    }

    getClosestNode(position, zoneName) {
        if(!this.hasZone(zoneName) || !position) return null;

        const groupID = this.getGroup(zoneName,position);
        if(groupID == null) return null;

        return this.pathfinder.getClosestNode(position,zoneName,groupID)
    }
}